var express = require('express');
var app = express();
var mongoose = require('mongoose')
var ejs = require('ejs');
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
var async = require('async')

var isDebugMode = true;


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

var User = mongoose.model('user', dbSchema.userSchema);
var Post = mongoose.model('post', dbSchema.postSchema);
var Draft = mongoose.model('draft', dbSchema.postSchema);
var Comment = mongoose.model('comment', dbSchema.commentSchema);


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
    handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
  })
})

app.get('/signup', (req, res) => {
  if (req.session.userID) {
    User.findById(req.session.userID, (err, loginAs) => {
      if (err) {
        res.redirect('/logout');
      } else {
        if (loginAs.isAdmin) {
          res.render('html/signup', {
            title: 'sign up - postenuous'
          });
        } else {
          handleData.handleForbidden(req, res, 'ejs/http-error.ejs');
        }
      }
    })
  } else {
    handleData.handleForbidden(req, res, 'ejs/http-error.ejs');
  }
})


app.get('*/login', (req, res) => {
  res.render('html/login', {
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
        if (isDebugMode) console.log(postData);
        postData.save().then(result => {
          res.redirect('/');
        }).catch(err => {
          console.log(err);
          handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
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
        res.render('ejs/editor-post.ejs', {
          title: 'new post - postenuous',
          loginAs: loginAs,
          formaction: 'addPost'
        })
      }
    })
  } else {
    handleData.handleForbidden(req, res, 'ejs/http-error.ejs');
  }
})

app.post('*/:id/deletePost', (req, res) => {
  if (req.session.userID) {
    async.waterfall([
      (cb) => {
        User.findById(req.session.userID, (err, loginAs) => {
          cb(err, loginAs);
        })
      },
      (loginAs, cb) => {
        Post.findById(req.params.id).populate('author').exec((err, post) => {
          cb(err, loginAs, post);
        })
      },
      (loginAs, post, cb) => {
        if ((req.body.confirmpassword == post.author.password || (loginAs.isAdmin && req.body.confirmpassword == loginAs.password)) && (req.body.confirmtitle == post.title)) {
          cb(null, post);
        } else {
          cb(true, post);
        }
      }
    ], (err, post) => {
      if (err) {
        handleData.handleForbidden(req, res, 'ejs/http-error.ejs')
      } else {
        console.log('post removed: ' + post.title);
        post.remove();
        res.redirect('/post')
      }
    })
  }
  else {
    handleData.handleForbidden(req, res, 'ejs/http-error.ejs')
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


app.get('/test/post/:id', async (req, res) => {
  var post;
  Post.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec().catch(() => {
    handleData.handleNotFound(req, res, 'ejs/http-error.ejs')
  }).then()
  console.log(post);
  res.send('ok');
})

app.get('/post/:id', (req, res) => {
  var results = {};
  var done = function (key, value) {
    results[key] = value;
    if (isDebugMode) console.log(Object.keys(results).length + ' - ' + key)
    if (Object.keys(results).length === 5) {
      results.title = results.post.title + ' - postenuous'
      switch (results.mode) {
        case 'editor':
          res.render('ejs/post.ejs', results);
          break;

        case 'other-user':
          res.render('ejs/post-other.ejs', results);
          break;

        case 'visitor':
        default:
          res.render('ejs/post-visitor.ejs', results);
          break;
      }
    }
  }

  //to refresh the viewCount
  Post.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec((err, post) => {
    if (err) {
      handleData.handleNotFound(req, res, 'ejs/http-error.ejs');
    } else {
      Post.findById(req.params.id).populate('author').populate('comments').exec(async (err, post) => {
        if (err) {
          handleData.handleNotFound(req, res, 'ejs/http-error.ejs');
        } else {
          done('post', post);
          await Post.findOne({ 'created': { $lt: post.created } }).sort({ 'created': -1 }).exec().catch(
            () => { handleData.handleBadRequest(req, res, 'http-error') }
          ).then((prevPost) => { done('prevPost', prevPost) });
          await Post.findOne({ 'created': { $gt: post.created } }).exec().catch(
            () => { handleData.handleBadRequest(req, res, 'http-error') }
          ).then((nextPost) => { done('nextPost', nextPost) });

          if (req.session.userID) {
            let loginAs = await User.findById(req.session.userID).exec().catch(() => { res.redirect('/logout') });
            done('loginAs', loginAs);
            if (post.author.id == req.session.userID || loginAs.isAdmin) {
              done('mode', 'editor');
            } else {
              done('mode', 'other-user');
            }
          } else {
            done('loginAs', undefined);
            done('mode', 'visitor');
          }
        }
      });
    }
  });
});

app.get('/post/page/:pageno', (req, res) => {
  Post.countDocuments({}, (err, postCount) => {
    if (err) {
      handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
    } else {
      var pageCount = Math.ceil(postCount / 10);
      pageCount = (pageCount == 0) ? 1 : pageCount;
      var pageno = parseInt(req.params.pageno);
      if (pageno > pageCount || pageno < 1 || pageno == NaN) {
        handleData.handleNotFound(req, res, 'ejs/http-error.ejs');
      } else {
        var query = Post.find({}).populate('author').sort({ created: -1 }).skip((parseInt(req.params.pageno) - 1) * 10).limit(10);
        query.exec((err, posts) => {
          if (err) {
            handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
          } else {
            if (req.session.userID) {
              User.findById(req.session.userID, (err, loginAs) => {
                if (err) {
                  res.redirect('/logout');
                } else {
                  res.render('ejs/index.ejs', {
                    title: 'postenuous',
                    loginAs: loginAs,
                    posts: posts,
                    pageno: pageno,
                    pageCount: pageCount
                  });
                }
              });
            } else {
              res.render('ejs/index-visitor.ejs', {
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
      handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
    } else {
      if (author) {
        Post.find({ author: author.id }).populate('author').sort({ created: -1 }).exec((err, posts) => {
          if (req.session.userID) {
            User.findById(req.session.userID, (err, loginAs) => {
              if (err) {
                res.redirect('/logout');
              } else {
                res.render('ejs/author.ejs', {
                  title: 'author: ' + req.params.author + ' - postenuous',
                  loginAs: loginAs,
                  author: author,
                  posts: posts
                });
              }
            });
          } else {
            res.render('ejs/author-visitor.ejs', {
              title: 'author: ' + req.params.author + ' - postenuous',
              author: author,
              posts: posts
            });
          }
        });
      } else {
        handleData.handleNotFound(req, res, 'ejs/http-error.ejs');
      }
    }
  })
});

app.post('*/login', (req, res) => {
  handleData.handleLogin(req, res, User);
});

app.get('/login-session-test', (req, res) => {
  if (req.session.userID) {
    res.render('html/loginsuccessed', {
      title: 'session-test',
      username: req.session.userID
    });
  } else {
    res.render('html/loginfailed', {
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
      handleData.handleNotFound(req, res, 'ejs/http-error.ejs');
    } else {
      console.log(user)
      if (user) {
        if (req.session.userID) {
          User.findById(req.session.userID, (err, loginAs) => {
            if (err) {
              handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
            } else {
              if (user.id == req.session.userID || (loginAs.isAdmin && !user.isAdmin)) {
                res.render('ejs/profile.ejs', {
                  title: user.username + '@postenuous',
                  loginAs: loginAs,
                  user: user
                });
              } else {
                res.render('ejs/profile-other.ejs', {
                  title: user.username + '@postenuous',
                  loginAs: loginAs,
                  user: user
                });
              }
            }
          });
        } else {
          res.render('ejs/profile-visitor.ejs', {
            title: user.username + '@postenuous',
            user: user
          });
        }
      } else {
        handleData.handleNotFound(req, res, 'ejs/http-error.ejs');
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

app.post("*/:id/addcomment", async (req, res) => {
  var comment = new Comment({
    body: req.body.comment,
    parentComment: (req.body.replyto == 'noreply') ? null : req.body.replyto,
    author: { name: req.body.name },
    postedOn: req.params.id
  })
  console.log(req.params.id)
  console.log(req.body)

  comment.save().then((result) => {
    Post.findByIdAndUpdate(req.params.id, { $push: { comments: comment.id } }).exec((err, post) => {
      if (err) {
        if (isDebugMode) console.log(err);
        handleBadRequest(req, res, 'http-error');
      }
      if (req.body.isAjax) {
        Post.findById(req.params.id).populate('comments').exec((err, post) => {
          ejs.renderFile('views/ejs/common/comments-area.ejs', { comments: post.comments }, (err, commentsHTML) => {
            if (err) console.log(err)
            ejs.renderFile('views/ejs/common/replyto-select.ejs', { comments: post.comments }, (err, replytoOptions) => {
              if (err) console.log(err)
              res.send({
                'comments': commentsHTML,
                'replytoOptions': replytoOptions,
                'commentsCount': post.comments.length
              });
            });
          });
        });
      } else {
        res.redirect('/post/' + req.params.id)
      }
    })
  }).catch(err => {
    if (isDebugMode) console.log(err);
    handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
  })
})

app.get('/*', (req, res) => {
  handleData.handleNotFound(req, res, 'ejs/http-error.ejs');
});

app.listen(3000, () => {
  console.log('Server listing on 3000');
})
