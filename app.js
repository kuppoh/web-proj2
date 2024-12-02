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

const AWS = require('aws-sdk');

require('dotenv').config();

// Set up the AWS SDK with DigitalOcean Spaces credentials
const spacesEndpoint = new AWS.Endpoint('web-project.sfo3.digitaloceanspaces.com');

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_ACCESS_KEY,  // Replace with your DigitalOcean Spaces access key
  secretAccessKey: process.env.DO_SECRET_KEY,  // Replace with your DigitalOcean Spaces secret key
  region: 'sf03', 
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

// Use the middleware for the /personal route
app.get('/', checkAuthenticated, async (req, res) => {
  const isAuthenticated = !!req.user;
  let portfolioData = {};

  try {
    portfolioData = await getContent();
  } catch (err) {
    console.error('Error fetching portfolio data:', err);
  }

  res.render('personal', { 
    isAuthenticated, 
    user: req.user ? { displayName: req.user.displayName, emails: req.user.emails } : null,
    portfolioData
  });
});

// Route for uploading a file
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Prepare file for upload to DigitalOcean Spaces
  const fileContent = fs.readFileSync(req.file.path);  // Read the file from local storage

  // Upload the file to DigitalOcean Spaces
  const params = {
    Bucket: 'your-space-name',  // Replace with your Space's name
    Key: req.file.originalname, // The name of the file in Spaces
    Body: fileContent,
    ACL: 'public-read'          // You can set it to private or other permissions
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Error uploading file');
    }

    // Remove the file from the local temporary storage
    fs.unlinkSync(req.file.path);

    // Send response with the file URL from Spaces
    res.send({
      message: 'File uploaded successfully',
      fileUrl: data.Location  // URL to access the uploaded file
    });
  });
});

const fetch = require('node-fetch');

async function getContent() {
  const response = await fetch('https://web-project.sfo3.digitaloceanspaces.com/portfolio-data.json');
  const data = await response.json();
  return data;
}

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

// i hope this works //