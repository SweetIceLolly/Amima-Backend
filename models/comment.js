const mongoose = require('mongoose');

const comment_schema = new mongoose.Schema({
    content: {
        type: String
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Comment = mongoose.model('Comment', comment_schema);
module.exports = Comment;