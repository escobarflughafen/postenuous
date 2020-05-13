var express = require('express');
var app = express();
var mongoose = require('mongoose')
var path = require('path');
var dbSchema = require('./models/dbSchema')
var dbname = process.argv[process.argv.length - 1]
mongoose.connect("mongodb://localhost:27017/" + dbname).then(
    () => console.log('connected to MongoDB. db is', dbname)).catch(
        err => console.error('failed to connect to MongoDB', err));
var bodyParser = require('body-parser')
app.use(express.static(path.join(__dirname, 'public')));
app.use("/public", express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
var session = require('express-session');
var cookie = require('cookie-parser');
var fileStore = require('session-file-store');

var dbUtil = require('./utils/dbUtil')

var identityKey = 'skey';
var handleData = require('./utils/handleData.js')

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


/*
function handleNotFound(req, res, view) {
    res.status(404).render(view, {
        req: req
    });
}
*/

var postSchema = dbSchema.postSchema;
var userSchema = dbSchema.userSchema;

var User = mongoose.model('user', userSchema);

var Post = mongoose.model('post', postSchema);

var Draft = mongoose.model('draft', postSchema);



app.get(["/", "/post", "/post/page"], (req, res) => {
    res.redirect('/post/page/1');
});


app.post('*/signup', (req, res) => {
    var newUser = new User({
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
        about: req.body.about
    });
    newUser.save().then(user => {
        res.redirect('/');
    }).catch(err => {
        console.log(err);
        handleData.handleBadRequest(req, res, 'http-error');
    })
})

app.get('/signup', (req, res) => {
    if (req.session.userID) {
        User.findById(req.session.userID, (err, loginAs) => {
            if (err) {
                res.redirect('/logout');
            } else {
                if (loginAs.isAdmin) {
                    res.render('signup', {
                        title: 'sign up - postenuous'
                    });
                } else {
                    handleData.handleForbidden(req, res, 'http-error');
                }
            }
        })
    } else {
        handleData.handleForbidden(req, res, 'http-error');
    }
})


app.get('*/login', (req, res) => {
    res.render('login', {
        title: 'login - postenuous'
    })
})

app.get('/logout', (req, res) => {
    handleData.handleLogout(req, res);
})


app.post('*/addPost', (req, res) => {
    if (req.session.userID) {
        User.findById(req.session.userID, (err, loginAs) => {
            if (err) {
                res.redirect('/logout')
            } else {
                var postData = new Post({
                    title: req.body.title,
                    author: loginAs.id,
                    modified: Date.now(),
                    tag: [],
                    body: req.body.body,
                    abstract: (req.body.brief == "") ? req.body.body.slice(0, 140) : req.body.brief
                });
                console.log(postData);
                postData.save().then(result => {
                    res.redirect('/');
                }).catch(err => {
                    console.log(err);
                    handleData.handleBadRequest(req, res, 'http-error');
                });
            }
        })
    };
});


app.get('*/newpost', (req, res) => {
    if (req.session.userID) {
        User.findById(req.session.userID, (err, loginAs) => {
            if (err) {
                res.redirect('/logout')
            } else {
                res.render('editor-post', {
                    title: 'new post - postenuous',
                    loginAs: loginAs,
                    formaction: 'addPost'
                })
            }
        })
    } else {
        handleData.handleForbidden(req, res, 'http-error');
    }
})

app.post('*/:id/deletePost', (req, res) => {
    if (req.session.userID) {
        console.log(req);
        User.findById(req.session.userID, (err, loginAs) => {
            if (err) {
                res.redirect('/logout')
            } else {
                if (req.body.passwd == loginAs.password) {
                    Post.findById(req.params.id, (err, post) => {
                        if (err) {
                            handleData.handleBadRequest(req, res, 'http-error');
                        } else {
                            post.remove();
                            res.redirect('/post');
                        }
                    });
                } else {
                    res.redirect('/post/' + req.params.id);
                }
            }
        })
    }
});

app.post('*/:id/modifyPost', (req, res) => {
    if (req.session.userID) {
        User.findById(req.session.userID, (err, loginAs) => {
            if (err) {
                res.redirect('/logout')
            } else {
                console.log(req);
                Post.findById(req.params.id, (err, post) => {
                    if (err) {
                        handleNotFound(req, res, 'notfound');
                    } else {
                        if (post.author == req.session.userID || loginAs.isAdmin) {
                            post.update({
                                title: req.body.title,
                                abstract: req.body.brief,
                                body: req.body.body,
                                modified: Date.now()
                            }, (err, raw) => {
                                res.redirect('/post/' + req.params.id);
                            })
                        }
                    }
                })
            }
        })
    }
})

app.get('/post/:id', (req, res) => {
    Post.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec((err, post) => {
        if (err) {
            handleData.handleNotFound(req, res, 'http-error');
        } else {
            //to refresh the viewCount
            Post.findById(req.params.id).populate('author').exec((err, post) => {
                if (err) {
                    handleData.handleNotFound(req, res, 'http-error');
                } else {
                    var prevPostQuery = Post.findOne({ 'created': { $lt: post.created } }).sort({ 'created': -1 });
                    var nextPostQuery = Post.findOne({ 'created': { $gt: post.created } });
                    prevPostQuery.exec((err, prevPost) => {
                        nextPostQuery.exec((err, nextPost) => {
                            if (req.session.userID) {
                                User.findById(req.session.userID, (err, loginAs) => {
                                    if (err) {
                                        res.redirect('/logout');
                                    } else {
                                        if (post.author.id == req.session.userID || loginAs.isAdmin) {
                                            res.render('post', {
                                                title: post.title + ' - postenuous',
                                                loginAs: loginAs,
                                                post: post,
                                                prevPost: prevPost,
                                                nextPost: nextPost
                                            });
                                        } else {
                                            res.render('post-other', {
                                                title: post.title + ' - postenuous',
                                                loginAs: loginAs,
                                                post: post,
                                                prevPost: prevPost,
                                                nextPost: nextPost
                                            });
                                        }
                                    }
                                })
                            } else {
                                res.render('post-visitor', {
                                    title: post.title + ' - postenuous',
                                    post: post,
                                    prevPost: prevPost,
                                    nextPost: nextPost
                                })
                            }
                        })
                    })
                }
            })
        }
    })
});

app.get('/post/page/:pageno', (req, res) => {
    Post.countDocuments({}, (err, postCount) => {
        if (err) {
            handleData.handleBadRequest(req, res, 'http-error');
        } else {
            var pageCount = Math.ceil(postCount / 10);
            pageCount = (pageCount == 0) ? 1 : pageCount;
            var pageno = parseInt(req.params.pageno);
            if (pageno > pageCount || pageno < 1 || pageno == NaN) {
                handleData.handleNotFound(req, res, 'http-error');
            } else {
                var query = Post.find({}).populate('author').sort({ modified: -1 }).skip((parseInt(req.params.pageno) - 1) * 10).limit(10);
                query.exec((err, posts) => {
                    if (err) {
                        handleData.handleBadRequest(req, res, 'http-error');
                    } else {
                        if (req.session.userID) {
                            User.findById(req.session.userID, (err, loginAs) => {
                                if (err) {
                                    res.redirect('/logout');
                                } else {
                                    res.render('index', {
                                        title: 'postenuous',
                                        loginAs: loginAs,
                                        posts: posts,
                                        pageno: pageno,
                                        pageCount: pageCount
                                    });
                                }
                            });
                        } else {
                            res.render('index-visitor', {
                                title: 'postenuous',
                                posts: posts,
                                pageno: pageno,
                                pageCount: pageCount
                            });
                        }
                    }
                });
            }
        }
    });
});

app.get('/author/:author', (req, res) => {
    User.findOne({ username: req.params.author }, (err, author) => {
        if (err) {
            handleData.handleBadRequest(req, res, 'http-error');
        } else {
            if (author) {
                Post.find({ author: author.id }).populate('author').exec((err, posts) => {
                    if (req.session.userID) {
                        User.findById(req.session.userID, (err, loginAs) => {
                            if (err) {
                                res.redirect('/logout');
                            } else {
                                res.render('author', {
                                    title: 'author: ' + req.params.author + ' - postenuous',
                                    loginAs: loginAs,
                                    author: author,
                                    posts: posts
                                });
                            }
                        });
                    } else {
                        res.render('author-visitor', {
                            title: 'author: ' + req.params.author + ' - postenuous',
                            author: author,
                            posts: posts
                        });
                    }
                });
            } else {
                handleData.handleNotFound(req, res, 'http-error');
            }
        }
    })
    /*
    Post.find({ author: req.params.author }).sort({ created: -1 }).exec((err, posts) => {
        if (posts.length == 0) {
            console.log('notfound author')
            handleData.handleNotFound(req, res, 'notfound');
        } else {
            console.log(posts.length);
            res.render('author', {
                author: req.params.author,
                posts: posts
            });
        }
    });
    */
});

//bad implementation

//app.get('/archive', (req, res) => {
/*  
Post.distinct('author', (err, authors) => { Post.find({}, (err, posts) => {
        var postCount = {};
        for (let i = 0; i < authors.length; i++) {
            postCount[authors[i]] = 0;
        }
        for (let i = 0; i < posts.length; i++) {
            let author = posts[i].author;
            postCount[author] += 1;
        }
        console.log(postCount);
        res.render('archive', {
            authors: authors,
            postCount: postCount
        });
    });
});
*/
/*
 User.find({}, (err, users) => {
     Post.find({}).populate('author').exec((err, posts) => {
         var postCount = {};
         for (let i = 0; i < users.length; i++) {
             postCount[users[i].username] = 0;
         }

         for (let i = 0; i < posts.length; i++) {
             if (posts[i].author) {
                 let author = posts[i].author.username;
                 postCount[author] += 1;
             }
         }

         console.log(postCount);
         let authors = users.map(x => x.username);
         res.render('archive', {
             authors: authors,
             postCount: postCount
         });

     })
 });
 */
/*
(err, posts) => {
        var postcount = {};
        for (let i = 0; i < users.length; i++) {
            postCount[users[i].username] = 0;
        }
        for 
*/
//});


/*
app.get('/login', (req, res) => {
    res.render('loginpage', {
        title: 'login - postenuous'
    });
});
*/

app.post('*/login', (req, res) => {
    handleData.handleLogin(req, res, User);
});

app.get('/login-session-test', (req, res) => {
    if (req.session.userID) {
        res.render('loginsuccessed', {
            title: 'session-test',
            username: req.session.userID
        });
    } else {
        res.render('loginfailed', {
            title: 'failed to login - postenuous'
        });
    }
})

app.get('/user', (req, res) => {
    if (req.session.userID) {
        User.findById(req.session.userID, (err, loginAs) => {
            res.redirect('/user/' + loginAs.username);
        });
    } else {
        res.redirect('/');
    }
})

app.get('/user/:username', (req, res) => {
    User.findOne({
        username: req.params.username
    }, (err, user) => {
        if (err) {
            handleData.handleNotFound(req, res, 'http-error');
        } else {
            console.log(user)
            if (user) {
                if (req.session.userID) {
                    User.findById(req.session.userID, (err, loginAs) => {
                        if (err) {
                            handleData.handleBadRequest(req, res, 'http-error');
                        } else {
                            if (user.id == req.session.userID || (loginAs.isAdmin && !user.isAdmin)) {
                                res.render('profile', {
                                    title: user.username + '@postenuous',
                                    loginAs: loginAs,
                                    user: user
                                });
                            } else {
                                res.render('profile-other', {
                                    title: user.username + '@postenuous',
                                    loginAs: loginAs,
                                    user: user
                                });
                            }
                        }
                    });
                } else {
                    res.render('profile-visitor', {
                        title: user.username + '@postenuous',
                        user: user
                    });
                }
            } else {
                handleData.handleNotFound(req, res, 'http-error');
            }
        }
    })
})

app.post('/user/:username/modifyProfile', (req, res) => {
    if (req.session.userID) {
        User.findById(req.session.userID, (err, loginAs) => {
            if (err) {
                res.redirect('/logout')
            } else {
                User.findOne({
                    username: req.params.username
                }, (err, user) => {
                    if (loginAs.id == user.id || loginAs.isAdmin) {
                        if (req.body.password == user.password) {
                            if (user.username == 'admin') {
                                let newName = (req.body.name == "") ? user.name : req.body.name;
                                user.update({
                                    name: newName,
                                    about: req.body.about,
                                }, (err, raw) => {
                                    res.redirect('/user/' + req.params.username);
                                });
                            } else {
                                let newUsername = (req.body.username == "") ? user.username : req.body.username;
                                let newName = (req.body.name == "") ? user.name : req.body.name;
                                user.update({
                                    username: newUsername,
                                    name: newName,
                                    about: req.body.about,
                                }, (err, raw) => {
                                    res.redirect('/user/' + req.params.username);
                                });
                            }
                        }
                        else {
                            res.redirect('/user/' + req.params.username);
                        }
                    }
                });
            }
        });
    }
})


app.get('/*', (req, res) => {
    handleData.handleNotFound(req, res, 'http-error');
});

app.listen(3000, () => {
    console.log('Server listing on 3000');
})
