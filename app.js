const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Define routes
app.get('/', (req, res) => {
  res.render('personal'); // Render the 'personal.ejs' file
});


app.get('/login', (req, res) => {
  res.render('login'); // Serve the 'login.html' file
});


// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});