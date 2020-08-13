// work with URL: '/'
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pathcfgs = require('../common.js');

const fileutil = require('');

var upload = multer({ dest: pathcfgs.publicPath });

// GETs

//POSTs

router.post('/upload', upload.single('file'), (req, res) => {
  
});

module.exports = router;