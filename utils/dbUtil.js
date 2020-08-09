var mongoose = require('mongoose')
// var async = require('async');
var handleData = require('../utils/handleData')
var dbSchema = require('../models/dbSchema');
var userSchema = dbSchema.userSchema;
var postSchema = dbSchema.postSchema;

exports.setAdmin = function (userID, userModel, callback) {
  // procedure seq: findUser => userUpdate => callback
  userModel.findByID(userID, (err, user) => {
    if (!err) {
      user.update({
        isAdmin: true
      }).exec(callback());
    }
  })
}
/*
exports.asyncSetAdmin = function (userID, userModel, callback) {
  async.waterfall([
    (cb) => { cb(null, userID, userModel) },
    (userID, userModel, cb) => {
      userModel.findByID(userID, (err, user) => {
        cb(err, user);
      });
    },
    (user, cb) => {
      cb.update({ isAdmin: true }, (err, raw) => {
        cb(err, raw);
      });
    }
  ], (err, result) => {
    if (err) {
      throw (err);
    } else {
      callback();
    }
  });
}

exports.getAllDocument = function (model, callback) {
  async.waterfall([
    (cb) => { cb(null, model) },
    (model, cb) => {
      model.find({}, (err, users) => {
        cb(err, users);
      })
    }
  ], (err, users) => {
    if (err) {
      throw (err)
    } else {
      callback(users);
    }
  })
}
*/
exports.getLoginAs = async function (req, res, userModel, callback) {
  if (req.session.userID) {
    var err;
    try {
      var loginAs = await userModel.findById(req.session.userID).exec();
    } catch (err) {
      res.redirect('/logout')
    }
    callback(err, loginAs);
  } else {
    handleData.handleForbidden(req, res, 'ejs/http-error.ejs');
  }
}

exports.getPost = function (postID, postModel, callback) {
    postModel.findByID(postID, (err, post) => {
      callback(err, post);
    });
}