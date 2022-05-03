const LoginToken = require('./schema/login_token');

function check_login_token(req, res, next) {
  // TODO: Check if the token is valid
  next();
}

module.exports = {
  check_login_token: check_login_token
};
