var express = require('express');
var app = express();
var mongoose = require('mongoose')
var ejs = require('ejs');
var path = require('path');
var dbSchema = require('./models/dbSchema')
var dbname = process.argv[2]

var listenPort = parseInt(process.argv[3])
if (listenPort.toString() == 'NaN')
  listenPort = 3000;

mongoose.connect("mongodb://localhost:27017/" + dbname).then(
  () => console.log('connected to MongoDB. db is', dbname)).catch(
    err => console.error('failed to connect to MongoDB', err));
var bodyParser = require('body-parser')
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

// setting static directories
app.use("/static", express.static(path.join(__dirname, 'static')));

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
var Draft = mongoose.model('draft', dbSchema.draftSchema);
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
          body: req.body.body,
          abstract: (req.body.brief == "") ? req.body.body.slice(0, 140) : req.body.brief,
          tags: handleData.handleTags(req.body.tags),
          isPrivate: req.body.isprivate == 'true',
          enableComment: req.body.disablecomment != 'true',
          history: [{
            title: req.body.title,
            abstract: (req.body.brief == "") ? req.body.body.slice(0, 140) : req.body.brief,
            body: req.body.body,
            tags: handleData.handleTags(req.body.tags)
          }]
        });
        if (isDebugMode) console.log(postData);
        postData.save().then(async (result) => {
          if (req.body.draft != 'new') {
            await Draft.findByIdAndUpdate(req.body.draft, { removed: true }).exec();
          }
          res.redirect('/post/' + postData.id);
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
    User.findById(req.session.userID, async (err, loginAs) => {
      if (err) {
        res.redirect('/logout');
      } else {
        res.render('ejs/editor-post.ejs', {
          title: 'new post - postenuous',
          post: false,
          headings: 'create new post',
          loginAs: loginAs,
          drafts: await Draft.find({ author: loginAs.id, removed: false }).exec(),
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
              console.log(req.body);
              post.update({
                title: req.body.title,
                abstract: (req.body.brief == "") ? req.body.body.slice(0, 140) : req.body.brief,
                body: req.body.body,
                modified: Date.now(),
                tags: handleData.handleTags(req.body.tags),
                isPrivate: req.body.isprivate == 'isprivate',
                enableComment: !(req.body.disablecomment),
                $push: {
                  history: {
                    title: req.body.title,
                    abstract: (req.body.brief == "") ? req.body.body.slice(0, 140) : req.body.brief,
                    body: req.body.body,
                    tags: handleData.handleTags(req.body.tags)
                  }
                }
              }, async (err, raw) => {
                if (err) {
                  console.log(err)
                  handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
                } else {
                  if (req.body.draft != 'new') {
                    await Draft.findByIdAndUpdate(req.body.draft, { removed: true }).exec();
                  }
                  res.redirect('/post/' + req.params.id);
                }
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
      console.log(results)
      switch (results.mode) {
        case 'author':
          res.render('ejs/post.ejs', results);
          break;

        case 'other-user':
          res.render('ejs/post.ejs', results);
          break;

        case 'visitor':
          res.render('ejs/post.ejs', results);
          break;

        case 'forbidden':
        default:
          handleData.handleForbidden(req, res, 'ejs/http-error.ejs');
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
            () => { handleData.handleBadRequest(req, res, 'http-error.ejs') }
          ).then((prevPost) => { done('prevPost', prevPost) });
          await Post.findOne({ 'created': { $gt: post.created } }).exec().catch(
            () => { handleData.handleBadRequest(req, res, 'http-error.ejs') }
          ).then((nextPost) => { done('nextPost', nextPost) });

          // TODO: add sharekey feature
          if (req.session.userID) {
            let loginAs = await User.findById(req.session.userID).exec().catch(() => { res.redirect('/logout') });
            done('loginAs', loginAs);
            if (post.author.id == req.session.userID) {
              done('mode', 'author');
            } else {
              if (post.isPrivate) {
                done('mode', 'forbidden')
              } else {
                done('mode', 'other-user');
              }
            }
          } else {
            done('loginAs', undefined);
            if (post.isPrivate) {
              done('mode', 'forbidden')
            } else {
              done('mode', 'visitor');
            }
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
      let postPerPage = 12;
      if (req.query.perpage) {
        postPerPage = parseInt(req.query.perpage) || postPerPage
      }
      var pageCount = Math.ceil(postCount / postPerPage);
      pageCount = (pageCount == 0) ? 1 : pageCount;
      var pageno = parseInt(req.params.pageno);
      if (pageno > pageCount || pageno < 1 || pageno == NaN) {
        handleData.handleNotFound(req, res, 'ejs/http-error.ejs');
      } else {
        var query = Post.find({}).populate('author').sort({ created: -1 }).skip((parseInt(req.params.pageno) - 1) * postPerPage).limit(postPerPage);
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
                    pageCount: pageCount,
                    postPerPage: postPerPage
                  });
                }
              });
            } else {
              res.render('ejs/index-visitor.ejs', {
                title: 'postenuous',
                posts: posts,
                pageno: pageno,
                pageCount: pageCount,
                postPerPage: postPerPage
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
    author: {
      name: ((req.body.name == '') ? 'anonymous' : req.body.name),
      homepage: req.body.homepage,
      userID: req.session.userID
    },
    postedOn: req.params.id,
    from: JSON.stringify({
      remoteAddress: req.connection.remoteAddress,
      remoteFamily: req.connection.remoteFamily,
      remotePort: req.connection.remotePort
    })
  })

  comment.save().then((result) => {
    Post.findByIdAndUpdate(req.params.id, { $push: { comments: comment.id } }).exec((err, post) => {
      if (err) {
        if (isDebugMode) console.log(err);
        handleBadRequest(req, res, 'http-error.ejs');
      }
      if (req.body.isAjax) {
        if (req.session.userID) {
          User.findById(req.session.userID, (err, loginAs) => {
            if (err) {
              res.redirect('/logout')
            } else {
              Post.findById(req.params.id).populate('comments').populate('author').exec((err, post) => {
                ejs.renderFile('views/ejs/common/comments-area.ejs', { comments: post.comments, editable: (loginAs.isAdmin || (loginAs.username == post.author.username)) },
                  (err, commentsHTML) => {
                    if (err)
                      console.log(err)
                    else
                      ejs.renderFile('views/ejs/common/replyto-select.ejs', { comments: post.comments }, (err, replytoOptions) => {
                        if (err)
                          console.log(err)
                        else
                          res.send({
                            'comments': commentsHTML,
                            'replytoOptions': replytoOptions,
                            'commentsCount': post.comments.filter((comment) => { return !comment.disabled }).length
                          });
                      });
                  });
              });
            }
          })
        } else {
          Post.findById(req.params.id).populate('comments').exec((err, post) => {
            ejs.renderFile('views/ejs/common/comments-area.ejs', { comments: post.comments, editable: false }, (err, commentsHTML) => {
              if (err)
                console.log(err)
              else
                ejs.renderFile('views/ejs/common/replyto-select.ejs', { comments: post.comments }, (err, replytoOptions) => {
                  if (err)
                    console.log(err)
                  else
                    res.send({
                      'comments': commentsHTML,
                      'replytoOptions': replytoOptions,
                      'commentsCount': post.comments.filter((comment) => { return !comment.disabled }).length
                    });
                });
            });
          });
        }
      } else {
        res.redirect('/post/' + req.params.id)
      }
    })
  }).catch(err => {
    if (isDebugMode) console.log(err);
    handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
  })
})

app.post("*/:id/removecomment", async (req, res) => {
  // chain: user -> post -> comment -> render/send

  if (req.session.userID) {
    User.findById(req.session.userID).exec().catch((reason) => {
      if (isDebugMode) console.log(reason),
        res.redirect('/logout')
    }).then(async (user) => {
      return [
        user,
        await Comment.findById(req.body.commentID).populate({
          path: 'postedOn',
          populate: {
            path: 'author'
          }
        }).exec()
      ]
    }).catch((reason) => {
      if (isDebugMode) console.log(reason)
      handleData.handleBadRequest(req, res, 'ejs/http-error.ejs')
    }).then((data) => {
      console.log(data)
      let user = data[0], comment = data[1]
      if ((comment.postedOn.author.username == user.username) || user.isAdmin) {
        comment.update({ 'disabled': true }).exec();
        return Post.findById(comment.postedOn.id).populate('comments').exec();
      } else {
        handleData.handleForbidden(req, res, 'ejs/http-error.ejs')
      }
    }).catch((reason) => {
      if (isDebugMode) console.log(reason);
      handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
    }).then((post) => {
      if (req.body.isAjax) {
        ejs.renderFile('views/ejs/common/comments-area.ejs', { comments: post.comments, editable: true }, (err, commentsHTML) => {
          if (err)
            console.log(err)
          else
            ejs.renderFile('views/ejs/common/replyto-select.ejs', { comments: post.comments }, (err, replytoOptions) => {
              if (err)
                console.log(err)
              else
                res.send({
                  'comments': commentsHTML,
                  'replytoOptions': replytoOptions,
                  'commentsCount': post.comments.filter((comment) => { return !comment.disabled }).length
                });
            });
        });
      } else {
        res.redirect('/post/' + req.params.id)
      }
    });
  } else {
    handleData.handleForbidden(req, res, 'ejs/http-error.ejs')
  }
})

app.post("*/:id/togglecomment", async (req, res) => {
  // chain: user -> post -> comment -> render/send
  if (req.session.userID) {
    User.findById(req.session.userID).exec().catch((reason) => {
      if (isDebugMode) console.log(reason),
        res.redirect('/logout')
    }).then(async (user) => {
      return [
        user,
        await Comment.findById(req.body.commentID).populate({
          path: 'postedOn',
          populate: {
            path: 'author'
          }
        }).exec()
      ]
    }).catch((reason) => {
      if (isDebugMode) console.log(reason)
      handleData.handleBadRequest(req, res, 'ejs/http-error.ejs')
    }).then((data) => {
      let user = data[0], comment = data[1]
      if ((comment.postedOn.author.username == user.username) || user.isAdmin) {
        showRemovedComment = comment.disabled;
        comment.update({ 'disabled': !comment.disabled }).exec();
        return Post.findById(comment.postedOn.id).populate('comments').exec();
      } else {
        handleData.handleForbidden(req, res, 'ejs/http-error.ejs')
      }
    }).catch((reason) => {
      if (isDebugMode) console.log(reason);
      handleData.handleBadRequest(req, res, 'ejs/http-error.ejs');
    }).then((post) => {
      if (req.body.isAjax) {
        let commentAreaEJS = (req.body.isShowingRemovedComments == 'true') ? 'views/ejs/common/comments-area-all.ejs' : 'views/ejs/common/comments-area.ejs'
        ejs.renderFile(commentAreaEJS, { comments: post.comments, editable: true }, (err, commentsHTML) => {
          if (err)
            console.log(err)
          else
            ejs.renderFile('views/ejs/common/replyto-select.ejs', { comments: post.comments }, (err, replytoOptions) => {
              if (err)
                console.log(err)
              else
                res.send({
                  'comments': commentsHTML,
                  'replytoOptions': replytoOptions,
                  'commentsCount': post.comments.filter((comment) => { return !comment.disabled }).length
                });
            });
        });
      } else {
        res.redirect('/post/' + req.params.id)
      }
    });
  } else {
    handleData.handleForbidden(req, res, 'ejs/http-error.ejs')
  }
})

app.post('*/:id/toggleallcomment', (req, res) => {
  if (req.session.userID) {
    User.findById(req.session.userID, (err, loginAs) => {
      if (err) {
        res.redirect('/logout')
      } else {
        Post.findById(req.params.id).populate('author').populate('comments').exec((err, post) => {
          if (loginAs.isAdmin || loginAs.username == post.author.username) {
            if (req.body.isAjax) {
              let data = {}
              handleData.renderComment(post, true, (req.body.showDisabledComments == 'true'), data)
              res.send(data);
            } else {
              res.redirect(req.url)
            }
          } else {
            handleData.handleForbidden(req, res, 'ejs/http-error.ejs')
          }
        })
      }
    })
  } else {
    handleData.handleForbidden(req, res, 'ejs/http-error.ejs')
  }
})


app.post('*/savetodraft', async (req, res) => {
  if (req.session.userID) {
    var user = await User.findById(req.session.userID).exec();
    /*
    var availableTo = req.body.availableto.split(' ')
      .filter((username) => { return username != '' })
      .map(async (username) => {
        return await User.distinct('username', { 'username': username }).exec();
      });
    console.log(availableTo)
    */
    var draft;
    var data = {
      author: user.id,
      title: req.body.title,
      abstract: req.body.abstract || req.body.body.slice(0, 140),
      body: req.body.body,
      tags: handleData.handleTags(req.body.tags),
      isPrivate: req.body.isPrivate == 'true',
      enableComment: req.body.disableComment == 'false',
      //availableTo: req.body.availableTo.split('')
    }
    console.log(req.body)
    try {
      draft = await Draft.findById(req.body.draftID).exec();
    } catch (err) {
      console.log(err);
      draft = new Draft(data)
    }
    console.log(draft)
    if (draft.isNew) {
      await draft.save()
    } else {
      await draft.update(data).exec()
    }
    if (req.body.isAjax) {
      res.send(JSON.stringify({
        id: draft.id,
        title: draft.title,
        abstract: draft.abstract
      }))
    } else {
      res.redirect(req.url)
    }
  } else {
    handleData.handleForbidden(req, res, 'ejs/http-error.ejs');
  }
})

app.post('*/getdraft', async (req, res) => {
  dbUtil.getLoginAs(req, res, User, async (err, loginAs) => {
    if (err) {
      res.redirect('/logout');
    } else {
      try {
        var draft = await Draft.findById(req.body.draftID).exec();
      } catch (err) {
        handleBadRequest(req, res, 'ejs/http-error.ejs')
      }
      res.send(JSON.stringify({
        title: draft.title,
        abstract: draft.abstract,
        tags: draft.tags.join(','),
        body: draft.body,
        isPrivate: draft.isPrivate,
        disableComment: !draft.enableComment,
        availableTo: draft.availableTo
      }));
    }
  });
});


app.post('*/gethistory', async (req, res) => {
  console.log(req.body)
  dbUtil.getLoginAs(req, res, User, async (err, loginAs) => {
    if (err) {
      res.redirect('/logout');
    } else {
      try {
        var post = await Post.findById(req.body.postID).exec();
      } catch (err) {
        handleBadRequest(req, res, 'ejs/http-error.ejs');
      }
      console.log(post);
      if (post.author != loginAs.id) {
        handleData.handleForbidden(req, res, 'ejs/http-error.ejs');
      } else {
        var i = parseInt(req.body.i)
        res.send(JSON.stringify({
          title: post.history[i].title,
          abstract: post.history[i].abstract,
          tags: post.history[i].tags.join(','),
          body: post.history[i].body,
        }));
      }
    }
  });
});

app.get('*/:id/edit', async (req, res) => {
  dbUtil.getLoginAs(req, res, User, async (err, loginAs) => {
    if (err) {
      res.redirect('/logout')
    } else {
      let post = await Post.findById(req.params.id).populate('author').exec();
      res.render('ejs/editor-post.ejs', {
        title: 'post editor - postenuous',
        post: post,
        headings: 'edit your post',
        loginAs: loginAs,
        drafts: await Draft.find({ author: loginAs.id, removed: false }).exec(),
        formaction: 'modifyPost'
      });
    }
  })
})

app.get('/redirect', (req, res) => {
  var redirectTo = req.query.site;
  if (redirectTo) {
    if (redirectTo[0] == '/') {
      res.redirect(redirectTo);
    } else {
      if (redirectTo.split('://').length == 1) {
        redirectTo = 'http://' + redirectTo
      }
      handleData.handleRedirect(req, res, redirectTo, 'ejs/redirect.ejs');
    }
  } else {
    handleData.handleNotFound(req, res, 'ejs/http-error.ejs');
  }
})


app.get('/latencytest', (req, res) => {
  res.render('ejs/latencytest.ejs', {
    title: 'network latency test - postenuous'
  })
})

app.post('/latencytest', (req, res) => {
  res.send(JSON.stringify({ atServer: Date.now() }));
})

/*
  <- default NotFound routing ->
*/

app.get('/*', (req, res) => {
  console.log(req.url)
  console.log(req.session)
  handleData.handleNotFound(req, res, 'ejs/http-error.ejs');
});

app.listen(listenPort, () => {
  console.log('Server listing on ' + listenPort);
})
