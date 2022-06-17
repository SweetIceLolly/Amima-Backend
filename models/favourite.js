const mongoose = require('mongoose');

const favourite_schema = new mongoose.Schema({
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
  fav_at: {
    type: Date,
    default: Date.now
  }
});

const Comment = mongoose.model('Favourite', favourite_schema);
module.exports = Comment;
