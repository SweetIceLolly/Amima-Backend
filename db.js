const mongoose = require('mongoose');

function connect() {
  return mongoose.connect(process.env.DB_URI);
}

module.exports = {
  connect: connect
};
