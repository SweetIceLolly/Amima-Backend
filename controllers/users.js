const User = require('../models/user');
const tokensController = require('../controllers/tokens');
const utils = require('../utils');

function create_user(req, res, next) {
  if (!utils.check_body_fields(req.body, ['email', 'provider', 'oauth_token'])) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }

  // TODO authenticate with google or facebook

  // Check if the user already exists
  User.findOne({
    email: req.body.email
  }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (user) {
      // User already exists
      return res.status(409).json({
        error: 'User already exists'
      });
    }

    // Create a new user
    const new_user = new User({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      provider: req.body.provider,
      bio: '',
      created_at: new Date(),
      posts: [],
      favorites: [],
    });

    new_user.save((err, user) => {
      if (err) {
        return res.status(500).json({
          error: 'Internal server error'
        });
      }

      req.body.auth_user = user;

      next();
    });
  });
}

function get_user(req, res, next) {
  res.send('get_user');
}

function login(req, res, next) {
  if (!utils.check_body_fields(req.body, ['email', 'provider', 'oauth_token'])) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }

  // TODO authenticate with google or facebook

  // Match the email to a user
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    req.body.auth_user = user;

    next();
  });
}

module.exports = {
  create_user: create_user,
  get_user: get_user,
  login: login
};
