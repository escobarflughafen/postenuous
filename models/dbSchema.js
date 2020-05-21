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
            type: mongoose.Schema.Types.ObjectId,
            ref: 'comment'
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
    isAdmin: {
        type: Boolean,
        default: false
    }
});

var commentSchema = new mongoose.Schema({
    body: String,
    author: {
        type: {
            name: {
                type: String,
                default: 'anonymous'
            }
        }
    },
    postedOn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment',
        default: null
    },
    score: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});



exports.postSchema = postSchema
exports.userSchema = userSchema
exports.commentSchema = commentSchema