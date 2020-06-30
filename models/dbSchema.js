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
    enableComment: {
        type: Boolean,
        default: true
    },
    isPrivate: {
        type: Boolean,
        default: true
    },
    availableTo: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'user',
        default: []
    },
    history: {
        type: [{
            title: String,
            abstract: String,
            body: String,
            modifiedAt: {
                type: Date,
                default: Date.now
            },
            tags: [String]
        }],
        default: []
    },
    removed: {
        type: Boolean,
        default: false
    }
});

var draftSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    title: String,
    abstract: String,
    body: String,
    tags: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    availableTo: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'user',
        default: []
    },
    enableComment: {
        type: Boolean,
        default: true
    },
    removed: {
        type: Boolean,
        default: false
    }
})

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
            },
            homepage: {
                type: String,
                default: ''
            },
            userID:  {
                type: mongoose.Schema.Types.ObjectId,
                default: null
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
    },
    from: {
        type: String,
        default: ""
    },
    disabled: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    }
});

var logSchema = new mongoose.Schema({
    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    log: String,
    time: {
        type: Date,
        default: Date.now
    }
})

exports.postSchema = postSchema
exports.userSchema = userSchema
exports.draftSchema = draftSchema
exports.commentSchema = commentSchema
exports.logSchema = logSchema