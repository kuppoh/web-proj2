const express = require('express');
const { checkAuthenticated } = require('../utils/middleware');

const router = express.Router();

router.get('/', checkAuthenticated, (req, res) => {
  res.render('personal', { 
      user: req.user ? { displayName: req.user.displayName, emails: req.user.emails } : null 
  });
});



module.exports = router;
