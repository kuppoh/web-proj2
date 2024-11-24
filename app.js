const express = require('express');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const session = require('express-session');
const cookieParser = require('cookie-parser');
const cookieEncryption = require('cookie-encryption');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());

// Custom session store implementation
class CustomStore extends session.Store {
  constructor() {
    super();
    this.sessions = {};
  }

  get(sid, callback) {
    const sessionData = this.sessions[sid];
    if (sessionData) {
      callback(null, JSON.parse(sessionData));
    } else {
      callback(null, null);
    }
  }

  set(sid, session, callback) {
    this.sessions[sid] = JSON.stringify(session);
    callback(null);
  }

  destroy(sid, callback) {
    delete this.sessions[sid];
    callback(null);
  }
}


// Configure session middleware with custom store
const secretKey = 'your-secret-key'; // Replace with a strong secret key

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  store: new CustomStore(),
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Create a Redis client
// const redisClient = redis.createClient({
//   host: '127.0.0.1', // or your Redis server's host
//   port: 6379,        // default Redis port
//   // password: 'your-redis-password' // if authentication is required
// });

// redisClient.on('error', (err) => {
//   console.error('Redis client error:', err);
// });

// redisClient.on('connect', () => {
//   console.log('Redis client connected');
// });

// redisClient.connect().catch(console.error);

// Configure session middleware
// Set up session middleware

// app.use(session({
//   store: new RedisStore({ client: redisClient }), // Use Redis for session storage
//   secret: 'your-session-secret',                   // Use a secret to sign the session ID cookie
//   resave: false,                                  // Don't resave unchanged sessions
//   saveUninitialized: false,                       // Don't save empty sessions
//   cookie: {
//     secure: true,                                // Set to true if using HTTPS
//     httpOnly: true,                               // Helps prevent XSS attacks
//     maxAge: 24 * 60 * 60 * 1000                            // Session expiration time (1 hour)
//   }
// }));

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());

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
// app.get('/login', checkNotAuthenticated, (req, res) => {
//   res.render('login'); // Serve the 'login.html' file
// });

// Define authentication routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  (req, res, next) => {
    console.log('Received callback from Google');
    next();
  },
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('Google authentication successful');
    // Log the login event and the user's email
    if (req.isAuthenticated()) {
      if (req.user && req.user.emails && req.user.emails[0]) {
        console.log(`User logged in: ${req.user.emails[0].value}`);
      } else {
        console.log('User logged in, but email not available');
      }
      // Successful authentication, redirect home.
      req.session.user = req.user;
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

  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});


// Define login route
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login', { isAuthenticated: req.isAuthenticated() });
});


// Use the middleware for the /personal route
app.get('/', (req, res) => {
  console.log('isAuthenticated:', req.isAuthenticated());
  console.log('user:', req.user);
  res.render('personal', { 
    isAuthenticated: req.isAuthenticated(), 
    user: req.user ? { displayName: req.user.displayName, emails: req.user.emails } : null 
  });
});
// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});