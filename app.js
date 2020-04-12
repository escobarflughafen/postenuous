// Setup
var express = require('express');
var app = express();
var mongoose = require('mongoose')
var path = require('path');
mongoose.connect("mongodb://localhost:27017/aoiblog")
var bodyParser = require('body-parser')
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

var postSchema = new mongoose.Schema({
    title: String,
    author: String,
    created: {
        type: Date,
        default: Date.now
    },
    modified: Date,
    tag: [String],
    body: String,
    abstract: String
});

var Post = mongoose.model('post', postSchema);

// Routes
app.get("/", (req, res) => {
    Post.find({}, (err, posts) => {
        res.render('index', { posts: posts })
    });
});
/*
app.get('/addPost', (req, res) => {
    Post.find({}, (err, posts) => {
        res.render('index', { posts: posts })
    });
});
*/
app.post('/addPost', (req, res) => {
    console.log(req);
    var postData = new Post({
        title: req.body.title,
        author: req.body.author,
        modified: Date.now,
        tag: [],
        body: req.body.body,
        abstract: req.body.body.slice(0, 50)
    });
    console.log(postData);
    postData.save().then(result => {
        res.redirect('/');
    }).catch(err => {
        res.status(400).send("Unable to save data");
    });
});



// Listen
app.listen(3000, () => {
    console.log('Server listing on 3000');
})