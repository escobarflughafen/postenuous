// work with URL: '/author'
const express = require('express');
const router = express.Router();

// GETs
router.get("/", (req, res) => {
  res.redirect("/archive/author")
})

router.get("/:username", (req, res) => {

})

module.exports = router;