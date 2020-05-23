var ejs = require('ejs')

exports.handleNotFound = function (req, res, view) {
    res.status(404).render(view, {
        title: 'not found - postenuous',
        code: 404,
        req: req
    });
}

exports.handleBadRequest = function (req, res, view) {
    res.status(400).render(view, {
        title: 'bad request - postenuous',
        code: 400,
        req: req
    });
}

exports.handleForbidden = function (req, res, view) {
    res.status(403).render(view, {
        title: 'forbidden - postenuous',
        code: 403,
        req: req
    })
}



exports.handleLogin = function (req, res, loginMongooseModel) {
    loginMongooseModel.findOne({
        username: req.body.username,
        password: req.body.password
    }, (err, user) => {
        if (err) {
            handleBadRequest(req, res, 'badrequest');
        } else {
            if (user) {
                req.session.regenerate((err) => {
                    if (err) {
                        handleBadRequest(req, res, 'badrequest');
                    } else {
                        req.session.username = req.body.username;
                        req.session.userID = user.id;
                        res.redirect('/');
                    }
                })
            } else {
                res.render('html/loginfailed');
            }
        }
    });
}

exports.handleLogout = function (req, res) {
    req.session.username = null;
    req.session.userID = null;
    res.redirect('/');
}


exports.renderComment = function (post, editable = false, showAll = false, dataObject) {
    var commentAreaEJS = (showAll) ? 'views/ejs/common/comments-area-all.ejs' : 'views/ejs/common/comments-area.ejs'

    console.log(showAll, commentAreaEJS)
    ejs.renderFile(commentAreaEJS, { 'comments': post.comments, 'editable': editable }, (err, commentsHTML) => {
        if (err)
            console.log(err)
        else
            ejs.renderFile('views/ejs/common/replyto-select.ejs', { comments: post.comments }, (err, replytoOptions) => {
                if (err)
                    console.log(err)
                else {
                    dataObject.commentsHTML = commentsHTML;
                    dataObject.replytoOptions = replytoOptions
                }
            });
    });
}