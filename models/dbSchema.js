var mongoose = require('mongoose')
var postSchema = new mongoose.Schema({
    title: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    created: {
        type: Date,
        default: Date.now
    },
    modified: Date,
    tags: [String],
    body: String,
    abstract: String,
    viewCount: {
        type: Number,
        default: 0
    },
    comments: {
        type: [{
            from: String,
            content: String,
            created: {
                type: Date,
                default: Date.now
            }

        }],
        default: []
    },

});

var userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    password: String,
    name: String,
    about: String,
    registeredDate: {
        type: Date,
        default: Date.now
    },
    comments: {
        type: [{
            from: String,
            content: String,
            created: {
                type: Date,
                default: Date.now
            }
        }],
        default: []
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

exports.postSchema = postSchema
exports.userSchema = userSchema