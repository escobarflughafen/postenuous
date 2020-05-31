var mongoose = require('mongoose')
var async = require('async');
var dbSchema = require('../models/dbSchema')
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

//exports.getPagination = function()


/*
async.waterfall([
  (cb) => { cb(null, '1', '2') },
  (arg1, arg2, cb) => {
    console.log('arg1 => ' + arg1);
    console.log('arg2 => ' + arg2);
    cb(null, '3')
  },
  (arg3, cb) => {
    console.log('arg3 => ' + arg3);
    cb(null, 'done');
  }
], (err, result) => {
  console.log('err => ' + err);
  console.log('result => ' + result);
});

var a = async () => {
  return 1;
}

var b = async () => {
  return 2;
}

var c = async () => {
  var r1 = await a()
  var r2 = await b()
  console.log(r1, r2)
}

c()

*/


exports.getLoginAs = async function (req, res, userModel, callback) {
  if (req.session.userID) {
    try {
      var loginAs = await userModel.findById(req.session.userID).exec();
    } catch (err) {
      var err = err;
    }
    callback(err, loginAs);
  } else {
    handleData.handleForbidden(req, res, 'ejs/http-error.ejs');
  }
}