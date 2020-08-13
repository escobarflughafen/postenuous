// work with URL: '/post'
const express = require('express');
const router = express.Router();

// GETs

// default router
router.get("/", (req, res) => {
  res.redirect('page/1');
})

router.get("/page/:pageno", (req, res) => {

});

router.get("/:id", (req, res) => {
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

router.get("/:id/edit", (req, res) => {

});

router.get("/newpost", (req, res) => {

});

// POSTs
router.post("/newpost", (req, res) => {

});

router.post("/savetodraft", (req, res )=> {

});

router.post("/getdraft", (req, res) => {

});

router.post("/:id/modifypost", (req, res) => {

});

router.post("/:id/archivepost", (req, res) => {

});

router.post("/:id/gethistory", (req, res) => {

})

router.post("/:id/deletepost", (req, res) => {

});

router.post("/:id/addcomment", (req, res) => {

});

router.post("/:id/removecomment", (req, res) => {

});

router.post("/:id/togglecomment", (req, res) => {

});

router.post("/:id/toggleallcomment", (req, res) => {

});


module.exports = router;