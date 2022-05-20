const mongoose = require('mongoose');

const image_schema = new mongoose.Schema({
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  originalFilename: {
    type: String
  }
});

const Image = mongoose.model('Image', image_schema);
module.exports = Image;
