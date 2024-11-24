const express = require('express');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport to use Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: '624534888737-450ntk4o8gvsdgc9emnuv3tv6pk6jocu.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'https://portfolio.rat-monkee.online/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  // In a real application, you would save the user info to your database here
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

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Define routes
app.get('/', (req, res) => {
  res.render('personal'); // Render the 'personal.ejs' file
});

app.get('/login', (req, res) => {
  res.render('login'); // Serve the 'login.html' file
});

// Define authentication routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Use the middleware for the /personal route
app.get('/personal', isAuthenticated, (req, res) => {
  res.render('personal', { isAuthenticated: req.isAuthenticated() });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});