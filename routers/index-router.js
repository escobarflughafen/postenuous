// work with URL: '/'
const express = require('express');
const router = express.Router();


// GETs
router.get("/", (req, res) => {
  res.redirect("/post");
})

module.exports = router;