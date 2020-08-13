// work with URL: '/archive'
const express = require('express');
const router = express.Router();

// GETs
router.get("/", (req, res) => {

});

// query archives by authors
router.get("/author", (req, res) => {

});

router.get("/author/:username", (req, res) => {

});

// query archives by date
router.get("/date", (req, res) => {
  

});


// query archives by tags
router.get("/tag", (req, res) => {

});

router.get("/tag/:tagname", (req, res) => {

});

module.exports = router;