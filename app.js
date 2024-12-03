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

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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
    } else {
      console.error('Failed to fetch data. Status:', response.status);
    }
  } catch (err) {
    console.error('Error fetching portfolio data:', err);
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
    portfolioData
  });
});


// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

// i hope this works //