const express = require('express');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

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
  clientID: '624534888737-450ntk4o8gvsdgc9emnuv3tv6pk6jocu.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'https://portfolio.rat-monkee.online/auth/google/callback'
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
  (req, res, next) => {
    console.log('Received callback from Google');
    next();
  },
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    console.log('Google authentication successful');
    if (req.isAuthenticated()) {
      if (req.user && req.user.emails && req.user.emails[0]) {
        console.log(`User logged in: ${req.user.emails[0].value}`);
      } else {
        console.log('User logged in, but email not available');
      }
      // Create JWT token
      const user = {
        displayName: req.user.displayName,
        emails: req.user.emails
      };
      const token = jwt.sign(user, secretKey, { expiresIn: '1d' });
      res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 });
      res.redirect('/?loggedIn=true');
    } else {
      console.log('User not authenticated');
      res.redirect('/login');
    }
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
  res.redirect('/login');
});

// Define login route
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login', { isAuthenticated: false });
});

// Use the middleware for the /personal route
app.get('/', checkAuthenticated, (req, res) => {
  const isAuthenticated = !!req.user;
  console.log('isAuthenticated:', isAuthenticated);
  console.log('user:', req.user);
  res.render('personal', { 
    isAuthenticated, 
    user: req.user ? { displayName: req.user.displayName, emails: req.user.emails } : null 
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});