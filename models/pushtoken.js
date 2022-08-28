const mongoose = require('mongoose');

const push_token_schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: [{
    type: String,
    required: true
  }]
});

const PushToken = mongoose.model('push_tokens', push_token_schema);
module.exports = PushToken;
