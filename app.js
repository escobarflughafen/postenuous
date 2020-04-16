var express = require('express');
var app = express();
var mongoose = require('mongoose')
var path = require('path');
mongoose.connect("mongodb://localhost:27017/aoiblog").then(
    () => console.log('connected to MongoDB.')).catch(
        err => console.error('failed to connect to MongoDB', err));
var bodyParser = require('body-parser')
app.use(express.static(path.join(__dirname, 'public')));
app.use("/public", express.static(path.join(__dirname, 'public')));
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


app.get(["/", "/post"], (req, res) => {
    Post.find({}, (err, posts) => {
        res.render('index', { posts: posts })
    });

});

app.post('/addPost', (req, res) => {
    console.log(req);
    var postData = new Post({
        title: req.body.title,
        author: req.body.author,
        modified: Date.now(),
        tag: [],
        body: req.body.body,
        abstract: (req.body.brief == "") ? req.body.body.slice(0, 280) : req.body.brief
    });
    console.log(postData);
    postData.save().then(result => {
        res.redirect('/');
    }).catch(err => {
        res.status(400).send("Unable to save data");
    });
});

app.get('/post/:id', async (req, res) => {
    await Post.findById(req.params.id, (err, post) => {
        console.log(post);
        res.render('post', { post });
    });
});

app.listen(3000, () => {
    console.log('Server listing on 3000');
})