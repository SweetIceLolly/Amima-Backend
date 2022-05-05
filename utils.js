const crypto = require('crypto');

function generate_token() {
  return crypto.randomBytes(32).toString('hex');
}
