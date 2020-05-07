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
    abstract: String,
    viewCount: {
        type: Number,
        default: 0
    },
    likeCount: {
        type: Number,
        default: 0
    }
});

var Post = mongoose.model('post', postSchema);

app.get(["/", "/post"], (req, res) => {
    Post.countDocuments({}, (err, postCount) => {
        var query = Post.find({}).sort({ modified: -1 }).limit(10);
        query.exec((err, posts) => {
            res.render('index', {
                posts: posts,
                pageno: 1,
                pageCount: Math.ceil(postCount / 10)
            });
        });
    });
});

app.post('*/addPost', (req, res) => {
    var author = (req.body.author == '') ? 'admin' : req.body.author;
    var postData = new Post({
        title: req.body.title,
        author: author,
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

app.post('*/:id/deletePost', (req, res) => {
    console.log(req);

    if (req.body.passwd == undefined) {
        res.redirect('/post/' + req.params.id);
    } else if (req.body.passwd == 'admin') {
        Post.findById(req.params.id, (err, post) => {
            post.remove();
            res.redirect('/post')
        });
    } else {
        res.redirect('/post/' + req.params.id);
    }
});

app.post('*/:id/modifyPost', (req, res) => {
    console.log(req);
    Post.findById(req.params.id, (err, post) => {
        post.update({
            title: req.body.title,
            author: req.body.author,
            abstract: req.body.brief,
            body: req.body.body,
            modified: Date.now()
        }, (err, raw) => {
            res.redirect('/post/' + req.params.id);
        })
    })
})

app.get('/post/:id', (req, res) => {
    Post.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();
    Post.findById(req.params.id, (err, post) => {
        var queryOlder = Post.find({ 'created': { $lt: post.created } }).sort({ 'created': -1 }).limit(1);
        var queryNewer = Post.find({ 'created': { $gt: post.created } }).limit(1);
        queryOlder.exec((err, olderPost) => {
            queryNewer.exec((err, newerPost) => {
                res.render('post', {
                    post: post,
                    newerPost: newerPost,
                    olderPost: olderPost
                });

            })
        })
    });
});

app.get('/post/page/:pageno', (req, res) => {
    Post.countDocuments({}, (err, postCount) => {
        console.log(postCount);
        console.log(req.params.pageno);
        var query = Post.find({}).sort({ modified: -1 }).skip((parseInt(req.params.pageno) - 1) * 10).limit(10);
        query.exec((err, posts) => {
            res.render('index', {
                posts: posts,
                pageno: parseInt(req.params.pageno),
                pageCount: Math.ceil(postCount / 10)
            });
        });
    });
});

app.get('/author/:author', (req, res) => {
    Post.find({ author: req.params.author }).sort({ created: -1 }).exec((err, posts) => {
        console.log(posts.length);
        res.render('author', {
            author: req.params.author,
            posts: posts
        });
    });
});

app.listen(3000, () => {
    console.log('Server listing on 3000');
})