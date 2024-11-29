const jwt = require('jsonwebtoken');
const secretKey = 'your-secret-key'; // Use environment variables for production

// Check if the user is authenticated
// In utils/middleware.js
function checkAuthenticated(req, res, next) {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, 'your-secret-key', (err, decoded) => {
      if (err) {
        // Token is not valid, mark as unauthenticated
        res.locals.isAuthenticated = false;
        req.user = null; // Ensure user is null
      } else {
        req.user = decoded; // Attach user data to the request object
        res.locals.isAuthenticated = true; // Set isAuthenticated to true
      }
      next(); // Proceed to the next middleware or route handler
    });
  } else {
    res.locals.isAuthenticated = false;
    req.user = null; // Ensure user is null when no JWT is present
    next();
  }
}


// Check if the user is not authenticated
function checkNotAuthenticated(req, res, next) {
  const token = req.cookies.jwt;
  if (token) {
    return res.redirect('/');
  }
  next();
}

// Check if the user is authorized to edit the portfolio
function checkAuthorizedToEdit(req, res, next) {
  const allowedEmail = 'kwacnang.23@gmail.com'; // Replace with your email
  if (req.user && req.user.emails && req.user.emails[0].value === allowedEmail) {
    return next();
  }
  return res.status(403).send('You are not authorized to edit this portfolio.');
}

module.exports = { checkAuthenticated, checkNotAuthenticated, checkAuthorizedToEdit };
