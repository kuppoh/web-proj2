const express = require('express');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const upload = multer({dest: 'uploads/'}) // temp storage
require('dotenv').config();
const fs = require('fs');


const app = express();
app.use(express.urlencoded({ extended: true })); // For form data
app.use(express.json()); // Middleware to parse JSON bodies

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());

const secretKey = 'your-secret-key'; // Replace with a strong secret key


// Configure Passport to use Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.G_CLIENT_ID,
  clientSecret: process.env.G_CLIENT_SECRET,
  callbackURL:  process.env.G_CALLBACK_URL

}, (accessToken, refreshToken, profile, done) => {
  console.log('Received callback from Google');
  console.log('Access Token:', accessToken);
  console.log('Refresh Token:', refreshToken);
  console.log('Profile:', profile);

  const user = {
    id: profile.id,
    displayName: profile.displayName,
    emails: profile.emails
  };
  
  return done(null, profile);
}));

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from the sessions
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Endpoint } = require('@aws-sdk/types');


require('dotenv').config();


// Initialize the S3 client with the endpoint URL directly
const s3Client = new S3Client({
  region: 'sfo3',  // DigitalOcean's region
  credentials: {
    accessKeyId: process.env.DO_ACCESS_KEY,
    secretAccessKey: process.env.DO_SECRET_KEY
  },
  endpoint: 'https://sfo3.digitaloceanspaces.com', // Directly specify the endpoint URL
  forcePathStyle: true // Required for DigitalOcean Spaces
});


// Middleware to check if the user is authenticated
function checkAuthenticated(req, res, next) {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        req.user = null;
      } else {
        req.user = decoded;
      }
      next();
    });
  } else {
    req.user = null;
    next();
  }
}
// Middleware to check if the user is not authenticated
function checkNotAuthenticated(req, res, next) {
  const token = req.cookies.jwt;
  if (token) {
    return res.redirect('/');
  }
  next();
}

// Define authentication routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const user = {
      displayName: req.user.displayName,
      emails: req.user.emails
    };
    const token = jwt.sign(user, secretKey, { expiresIn: '1d' });
    res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect('/?loggedIn=true');
  }
);


app.get('/logout', checkAuthenticated, (req, res) => {
  if (req.user && req.user.emails && req.user.emails[0]) {
    console.log(`User logged out: ${req.user.emails[0].value}`);
  } else {
    console.log('User logged out, but email not available');
  }

  // Clear the JWT cookie
  res.clearCookie('jwt');
  res.redirect('/');
});

// Define login route
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login', { isAuthenticated: false });
});


const fetch = require('node-fetch');

async function getContent() {
  try {
    const response = await fetch('https://web-project.sfo3.digitaloceanspaces.com/portfolio-data.json');
    const text = await response.text();  // Read the response body as text first
    console.log('Response Status:', response.status);
    console.log('Response Body:', text); // Log the response body

    if (response.ok) {
      // If the response is valid JSON, try to parse it
      const data = JSON.parse(text);
      console.log('Fetched data:', data);
      return data; // Return the fetched data
    } else {
      console.error('Failed to fetch data. Status:', response.status);
      return null; // Return null in case of failure
    }
  } catch (err) {
    console.error('Error fetching portfolio data:', err);
    return null; // Return null in case of error
  }
}

getContent();



app.get('/', checkAuthenticated, async (req, res) => {
  const isAuthenticated = !!req.user;
  let portfolioData = {};

  try {
    portfolioData = await getContent();
    if (!portfolioData) {
      console.error('Portfolio data could not be loaded.');
      portfolioData = {}; // Fallback to an empty object
    }
  } catch (err) {
    console.error('Error fetching portfolio data:', err);
    portfolioData = {}; // Fallback to an empty object
  }

  console.log('Portfolio data being sent to EJS:', portfolioData);

  res.render('personal', { 
    isAuthenticated, 
    user: req.user ? { displayName: req.user.displayName, emails: req.user.emails } : null,
    portfolioData // Pass portfolio data to EJS
  });
});


const bucketName = 'web-project'; // Replace with your actual bucket name


app.post('/save-portfolio', async (req, res) => {
  const updatedContent = req.body; // Get the updated content from the form

  try {
    // Step 1: Fetch the current portfolio data from your Space
    const getParams = {
      Bucket: bucketName,
      Key: 'portfolio-data.json', // Your file key in the Space
    };

    const { Body } = await s3Client.send(new GetObjectCommand(getParams));
    const data = await streamToString(Body); // Convert the stream to a string
    let portfolioData = JSON.parse(data);

    // Step 2: Update the portfolio data with the new content
    if (portfolioData.aboutMe && portfolioData.aboutMe.description) {
      portfolioData.aboutMe.description[0] = updatedContent.aboutMeDescription1 || portfolioData.aboutMe.description[0];
      portfolioData.aboutMe.description[1] = updatedContent.aboutMeDescription2 || portfolioData.aboutMe.description[1];
    }

    // Step 3: Prepare the updated data and upload it to your DigitalOcean Space
    const uploadParams = {
      Bucket: bucketName,
      Key: 'portfolio-data.json', // The file name to store in your Space
      Body: JSON.stringify(portfolioData, null, 2), // Updated portfolio data
      ContentType: 'application/json',
      ACL: 'public-read', // Modify as needed (public-read or private)
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Step 4: Respond with a success message and redirect to homepage
    console.log('Portfolio saved successfully!');
    res.redirect('/'); // Redirect to the homepage
  } catch (err) {
    console.error('Error saving portfolio data:', err);
    res.status(500).json({ message: 'Error saving data', error: err.message });
  }
});

app.post('/save-hobbies', async (req, res) => {
  const updatedContent = req.body; // Get the updated hobbies content from the form

  try {
    // Step 1: Fetch the current portfolio data from your Space
    const getParams = {
      Bucket: bucketName,
      Key: 'portfolio-data.json', // Your file key in the Space
    };

    const { Body } = await s3Client.send(new GetObjectCommand(getParams));
    const data = await streamToString(Body); // Convert the stream to a string
    let portfolioData = JSON.parse(data);

    // Step 2: Update the portfolio data with the new content
    if (portfolioData.hobbies) {
      portfolioData.hobbies = updatedContent['hobbies-description'].split('\n'); // Assuming hobbies are saved as a newline-separated string
    }

    // Step 3: Prepare the updated data and upload it to your DigitalOcean Space
    const uploadParams = {
      Bucket: bucketName,
      Key: 'portfolio-data.json', // The file name to store in your Space
      Body: JSON.stringify(portfolioData, null, 2), // Updated portfolio data
      ContentType: 'application/json',
      ACL: 'public-read', // Modify as needed (public-read or private)
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Step 4: Respond with a success message and redirect to homepage
    console.log('Hobbies saved successfully!');
    res.redirect('/'); // Redirect to the homepage or wherever you want
  } catch (err) {
    console.error('Error saving hobbies data:', err);
    res.status(500).json({ message: 'Error saving data', error: err.message });
  }
});


app.post('/save-project', async (req, res) => {
  const projectId = req.body['project-id'];
  const projectName = req.body['project-name'];
  const projectDescription = req.body['project-description'];

  try {
    // Step 1: Fetch the current portfolio data from your Space
    const getParams = {
      Bucket: bucketName,
      Key: 'portfolio-data.json', // Your file key in the Space
    };

    const { Body } = await s3Client.send(new GetObjectCommand(getParams));
    const data = await streamToString(Body); // Convert the stream to a string
    let portfolioData = JSON.parse(data);

    // Step 2: Find the project and update its data
    const project = portfolioData.projects.find(p => p.projectId === projectId);
    if (project) {
      project.name = projectName;
      project.description = projectDescription.split('\n'); // Assuming descriptions are in an array
    } else {
      return res.status(404).send('Project not found');
    }

    // Step 3: Prepare the updated data and upload it to your DigitalOcean Space
    const uploadParams = {
      Bucket: bucketName,
      Key: 'portfolio-data.json', // The file name to store in your Space
      Body: JSON.stringify(portfolioData, null, 2), // Updated portfolio data
      ContentType: 'application/json',
      ACL: 'public-read', // Modify as needed (public-read or private)
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Step 4: Respond with a success message and redirect to homepage
    console.log('Project saved successfully!');
    res.redirect('/'); // Redirect to the homepage
  } catch (err) {
    console.error('Error saving project data:', err);
    res.status(500).json({ message: 'Error saving data', error: err.message });
  }
});




// Helper function to convert the stream to string
const streamToString = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
};



// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

// i hope this works //