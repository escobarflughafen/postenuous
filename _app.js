const express = require('express');
const app = express();
const mongoose = require('mongoose')
const ejs = require('ejs');
const path = require('path');
const dbSchema = require('./models/dbSchema')
const dbname = process.argv[2]
const fileutil = require('./utils/fileutil.js')
const multer = require('multer');
const pathcfgs = require('./common.js');

var listenPort = parseInt(process.argv[3])
if (listenPort.toString() == 'NaN')
  listenPort = 3000;

mongoose.connect("mongodb://localhost:27017/" + dbname).then(
  () => console.log('connected to MongoDB. db is', dbname)).catch(
    err => console.error('failed to connect to MongoDB', err));
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
const session = require('express-session');
const cookie = require('cookie-parser');
const fileStore = require('session-file-store');
const dbUtil = require('./utils/dbUtil')
var identityKey = 'skey';
const handleData = require('./utils/handleData.js')
const async = require('async');
const { fileURLToPath } = require('url');
const { fstat } = require('fs');

var isDebugMode = true;

// settings for handling static directories
app.use(pathcfgs.staticURL, express.static(path.join(__dirname, pathcfgs.staticPath));

// settings for receiving files
app.use(pathcfgs.publicURL, express.static(path.join(__dirname, pathcfgs.publicPath)));

app.use(cookie());
app.use(session({
  name: 'final',
  secret: '123456',
  cookie: {
    maxAge: 1000 * 3600 * 24 * 7
  },
  resave: true,
  rolling: true
}));

app.use('/', require('routers/router.js'));

app.listen(listenPort, () => {
  console.log('Server listing on ' + listenPort);
})
