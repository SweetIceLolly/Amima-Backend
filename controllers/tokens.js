const utils = require('../utils');
const LoginToken = require('../models/token');

function check_login_token(req, res, next) {
  // Note: the token is in the header's auth field
  const token = req.headers.auth;
  if (!token) {
    return utils.response(req, res, 401, {error: 'No token provided'});
  }

  // Check if the token is valid
  LoginToken.findOne({ token }, (err, login_token) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    if (!login_token) {
      return utils.response(req, res, 401, {error: 'Invalid token'});
    }

    // Check if the token has expired
    if (login_token.expires_at <= Date.now()) {
      return utils.response(req, res, 401, {error: 'Token expired'});
    }

    if (req.body) {
      req.body.auth_user_id = login_token.user_id;
      req.body.auth_token = login_token;
    } else {
      req.auth_user_id = login_token.user_id;
      req.auth_token = login_token;
    }
    next();
  });
}

function create_token(req, res, next) {
  // Note: the user is in the body's auth_user field
  const user = req.body.auth_user;

  // Create a new token
  const token = new LoginToken({
    user_id: user._id,
    token: utils.generate_token(),
    created_at: Date.now(),
    expires_at: Date.now() + Number(process.env.TOKEN_EXPIRATION_TIME)
  });

  token.save((err, token) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    return utils.response(req, res, 200, {token: token.token, user_id: token.user_id});
  });
}

function renew_token(req, res, next) {
  // Note: the token is in the body's auth_token field
  // Extend the token's expiration time
  try {
    if (req.body) {
      req.body.auth_token.expires_at = Date.now() + Number(process.env.TOKEN_EXPIRATION_TIME);
      req.body.auth_token.save();
    }
    else {
      req.auth_token.expires_at = Date.now() + Number(process.env.TOKEN_EXPIRATION_TIME);
      req.auth_token.save();
    }

    next();
  }
  catch (err) {
    next();
  }
}

module.exports = {
  check_login_token: check_login_token,
  create_token: create_token,
  renew_token: renew_token
};
