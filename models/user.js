const mongoose = require('mongoose');

const user_schema = new mongoose.Schema({
  user_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profile_image: {
    type: String,
    default: 'default_avatar.png'
  },
  provider: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }]
});

const User = mongoose.model('User', user_schema);
module.exports = User;
