const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { checkAuthenticated, checkNotAuthenticated } = require('../utils/middleware');

const router = express.Router();
const secretKey = 'your-secret-key'; // Use environment variables for production

// Google OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// Google OAuth callback
// In auth.js, the Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }), 
  (req, res) => {
    const user = {
      displayName: req.user.displayName,
      emails: req.user.emails,
    };

    // Generate JWT
    const token = jwt.sign(user, 'your-secret-key', { expiresIn: '1d' });
    
    // Set JWT token in cookies
    res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 });
    console.log("Authenticated + JWT :", user, "|", user.emails)
    
    res.redirect('/'); // Redirect to home page or wherever you want
  }
);


// login
router.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login'); // No need to pass isAuthenticated
});

// logout
router.get('/logout', checkAuthenticated, (req, res) => {
  res.clearCookie('jwt', { path: '/' });
  res.redirect('/');
});


module.exports = router;
