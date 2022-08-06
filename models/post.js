const mongoose = require('mongoose');

const post_schema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  keywords: [String],
  images: [String],
  postDate: {
    type: Date,
    default: Date.now
  },
  posterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    required: true
  }
});

const Post = mongoose.model('Post', post_schema);
module.exports = Post;
