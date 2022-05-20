const User = require('../models/user');
const tokensController = require('../controllers/tokens');
const utils = require('../utils');

function create_user(req, res, next) {
  if (!utils.check_body_fields(req.body, ['email', 'provider', 'oauth_token'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
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
      return utils.response(req, res, 409, {error: 'User already exists'});
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
        return utils.response(req, res, 500, {error: 'Internal server error'});
      }

      req.body.auth_user = user;

      next();
    });
  });
}

function get_user(req, res, next) {
  const user_id = req.params.user;

  User.findOne({ _id: user_id }, (err, user) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    if (!user) {
      return utils.response(req, res, 404, {error: 'User not found'});
    }

    return utils.response(req, res, 200, user_id);
  });
}

function login(req, res, next) {
  if (!utils.check_body_fields(req.body, ['email', 'provider', 'oauth_token'])) {
    return utils.response(req, res, 400, 'Missing required fields');
  }

  // TODO authenticate with google or facebook

  // Match the email to a user
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    if (!user) {
      return utils.response(req, res, 404, {error: 'User not found'});
    }

    req.body.auth_user = user;

    next();
  });
}

function editProfile(req, res, next){
  if (!utils.check_body_fields(req.body, ['profileImg', 'userName', 'bio'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  User.findOneAndUpdate({ _id : req.body.auth_user }, { "$set": {
    profile_image: req.body.profileImg, 
    user_name: req.body.userName, 
    bio: req.body.bio
  }}).exec(function(err, user) {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    } else {
      return utils.response(req, res, 200, user);
    }
 });
}

module.exports = {
  create_user: create_user,
  get_user: get_user,
  login: login,
  editProfile: editProfile
};
