const express = require('express');
const { checkAuthenticated, checkAuthorizedToEdit } = require('../utils/middleware');

const router = express.Router();

// Edit page
router.get('/', checkAuthenticated, checkAuthorizedToEdit, (req, res) => {
  res.render('editPortfolio', { user: req.user });
});

router.post('/', checkAuthenticated, checkAuthorizedToEdit, (req, res) => {
  // Save portfolio updates (e.g., to a database)
  console.log(`Portfolio updated by ${req.user.displayName}`);
  res.redirect('/');
});

module.exports = router;
