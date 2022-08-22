const mongoose = require('mongoose');

const follower_schema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followed_at: {
    type: Date,
    default: Date.now
  },
  sub_post: {
    type: Boolean,
    default: true
  },
  sub_comment: {
    type: Boolean,
    default: true
  },
  sub_favourite: {
    type: Boolean,
    default: true
  },
  sub_follow: {
    type: Boolean,
    default: true
  }
});

const Follower = mongoose.model('Follower', follower_schema);
module.exports = Follower;
