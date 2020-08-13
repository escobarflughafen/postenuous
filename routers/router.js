// work with URL: '/'
const express = require('express');
const router = express.Router();

router.use('/post', require('./post-router'));
router.use('/author', require('./author-router'));
router.use('/archive', require('./archive-router'));

router.use('/', require('./index-router'));
router.use('/', require('./misc-router'));
router.use('/', require('./account-router'));

module.exports = router;