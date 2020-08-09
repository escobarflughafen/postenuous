module.exports = (app) => {
  const express = require('express')
  const router = express.Router()

  router.get(["/", "/post", "/post/page"], (req, res) => {
    res.redirect('/post/page/1')
  })

  router.post('*/signup', (req, res) => {

  })

  router.get('/signup', (req, res) => {

  })

  router.get('*/login', (req, res) => {

  })

  router.get('/logout', (req, res) => {

  })

  router.post('*/addPost', (req, res) => {

  })


  router.get('*/newpost', (req, res) => {

  })

  router.post('*/:id/deletePost', (req, res) => {

  })

  router.post('*/:id/modifyPost', (req, res) => {

  })

  router.get('/test/post/:id', async (req, res) => {

  })

  router.get('/post/:id', (req, res) => {

  })

  router.get('/post/page/:pageno', (req, res) => {

  })

  router.get('/author/:author', (req, res) => {

  })

  router.post('*/login', (req, res) => {

  })

  router.get('/login-session-test', (req, res) => {

  })

  router.get('/user', (req, res) => {

  })

  router.get('/user/:username', (req, res) => {

  })

  router.post('/user/:username/modifyProfile', (req, res) => {

  })

  router.post("*/:id/addcomment", async (req, res) => {

  })

  router.post("*/:id/removecomment", async (req, res) => {

  })

  router.post("*/:id/togglecomment", async (req, res) => {

  })

  router.post('*/:id/toggleallcomment', (req, res) => {

  })

  router.post('*/savetodraft', async (req, res) => {

  })

  router.post('*/getdraft', async (req, res) => {

  })

  router.post('*/gethistory', async (req, res) => {

  })

  router.get('*/:id/edit', async (req, res) => {

  })

  router.get('/redirect', (req, res) => {

  })

  router.post('/upload', upload.single('file'), (req, res) => {

  })

  router.get('/fileuploader', (req, res) => {

  })

  router.get('/latencytest', (req, res) => {

  })

  router.post('/latencytest', (req, res) => {

  })

  /*
    <- default NotFound routing ->
  */

  router.get('/*', (req, res) => {

  })

  module.exports = router
}
