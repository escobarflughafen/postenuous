var mongoose = require('mongoose')
var dbSchema = require('../models/dbSchema')
var userSchema = dbSchema.userSchema;
var postSchema = dbSchema.postSchema;

exports.setAdmin = function (userID, userModel) {
    userModel.findByID(userID, (err, user) => {
        if (!err) {
            user.update({
                isAdmin: true
            }).exec();
        }
    })
}