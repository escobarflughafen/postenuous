const express = require('express');
const app = express();

var listenPort = parseInt(process.argv[3])
if (listenPort.toString() == 'NaN')
  listenPort = 3000;

const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
const session = require('express-session');
const cookie = require('cookie-parser');
var identityKey = 'skey';

var isDebugMode = true;


app.use("/static", express.static(path.join(__dirname, 'static')));
app.use("/public", express.static(path.join(__dirname, 'public')));
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

var router = require('./routers/router')

mongoose.connect("mongodb://localhost:27017/" + dbname).then(
  () => console.log('connected to MongoDB. db is', dbname)).catch(
    err => console.error('failed to connect to MongoDB', err));

app.use('/', router);

app.listen(listenPort, () => {
  console.log('Server listing on ' + listenPort);
})
