const LoginToken = require('../models/token');

function check_login_token(req, res, next) {
  // Note: the token is in the header's auth field
  const token = req.headers.auth;
  if (!token) {
    return res.status(401).send('No token provided');
  }

  // Check if the token is valid
  LoginToken.findOne({ token }, (err, login_token) => {
    if (err) {
      return res.status(500).send(err);
    }

    if (!login_token) {
      return res.status(401).send('Invalid token');
    }

    // Check if the token has expired
    if (login_token.expires_at > Date.now()) {
      return res.status(401).send('Token expired');
    }

    req.login_token = login_token;
    next();
  });

  return res.status(401).send('No token provided');
}

module.exports = {
  check_login_token: check_login_token
};
