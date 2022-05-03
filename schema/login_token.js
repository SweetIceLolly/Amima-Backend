const mongoose = require('mongoose');

const login_token_schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  token: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  expires_at: {
    type: Date,
    required: true
  }
});

const LoginToken = mongoose.model('login_tokens', login_token_schema);
module.exports = LoginToken;
