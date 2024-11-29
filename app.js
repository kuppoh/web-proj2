const express = require('express');
const path = require('path');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('./config/passport'); // Modularize Passport configuration

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));



// Route Imports
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const editRoutes = require('./routes/edit');

// Middleware to make isAuthenticated globally available
// app.js
app.use((req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, 'your-secret-key', (err, decoded) => {
            if (!err) {
                req.user = decoded; // Attach user to the request
                res.locals.isAuthenticated = true; // Set isAuthenticated globally
            } else {
                res.locals.isAuthenticated = false;
            }
            next();
        });
    } else {
        res.locals.isAuthenticated = false;
        next();
    }
});

// Route Usage
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/edit', editRoutes);

// 404 Error Handling
app.use((req, res) => {
    res.status(404).render('personal')
});



// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
