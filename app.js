const express = require('express');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const RedisStore = require('connect-redis')(session);
const session = require('express-session');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Create a Redis client
const redisClient = redis.createClient({
  host: 'localhost', // or your Redis server's host
  port: 6379,        // default Redis port
  // password: 'your-redis-password' // if authentication is required
});

// Configure session middleware
// Set up session middleware
app.use(session({
  store: new RedisStore({ client: redisClient }), // Use Redis for session storage
  secret: 'your-session-secret',                   // Use a secret to sign the session ID cookie
  resave: false,                                  // Don't resave unchanged sessions
  saveUninitialized: false,                       // Don't save empty sessions
  cookie: {
    secure: true,                                // Set to true if using HTTPS
    httpOnly: true,                               // Helps prevent XSS attacks
    maxAge: 3600000                               // Session expiration time (1 hour)
  }
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

// Middleware to check if the user is authenticated
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Middleware to check if the user is not authenticated
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/'); // Redirect to home page if authenticated
  }
  next();
}

// Define routes
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login'); // Serve the 'login.html' file
});

// Define authentication routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Authentication failed:', info);
        return res.redirect('/login');
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }
        // Log the login event and the user's email
        if (req.user && req.user.emails && req.user.emails[0]) {
          console.log(`User logged in: ${req.user.emails[0].value}`);
        } else {
          console.log('User logged in, but email not available');
        }
        // Successful authentication, redirect home.
        return res.redirect('/');
      });
    })(req, res, next);
  }
);

app.get('/logout', checkAuthenticated, (req, res) => {
  if (req.user && req.user.emails && req.user.emails[0]) {
    console.log(`User logged out: ${req.user.emails[0].value}`);
  } else {
    console.log('User logged out, but email not available');
  }

  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

// Use the middleware for the /personal route
app.get('/', checkAuthenticated, (req, res) => {
  res.render('personal', { isAuthenticated: req.isAuthenticated(), user: req.user });
});
// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});