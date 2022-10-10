const User = require('../models/user');
const Image = require('../models/image')
const utils = require('../utils');
const { OAuth2Client } = require('google-auth-library');
const Post = require('../models/post');
const Comment = require('../models/comment');
const Favourite = require('../models/favourite');
const Token = require('../models/token');
const Follower = require('../models/follower');
const db = require('mongoose');
const AppleAuth = require('apple-auth');
const jwt = require("jsonwebtoken");


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verify_oauth_token(req, res, next) {
  if (!utils.check_body_fields(req.body, ['provider', 'loginData'])) {
    return utils.response(req, res, 400, 'Missing required fields');
  }

  // Check provider
  if (req.body.provider === 'google') {
    // Verify the JWT with Google
    const ticket = await client.verifyIdToken({
      idToken: req.body.loginData,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
      .catch(err => {
        return utils.response(req, res, 400, {error: 'Failed to verify token'});
      });

    if (!ticket.payload.email) {
      return utils.response(req, res, 400, 'No email associated');
    }
    req.body.google_user = ticket.payload;
    req.body.email = ticket.payload.email;
    next();
  }
  else if (req.body.provider === 'facebook') {
    // Verify the token with Facebook
    const verifyRes = await utils.http_get('https://graph.facebook.com/debug_token?input_token=' +
      req.body.loginData.accessToken +
      '&access_token=' +
      process.env.FACEBOOK_APP_TOKEN
    )
      .catch(err => {
        return utils.response(req, res, 400, {error: 'Failed to verify token'});
      });

    // Check App ID
    if (verifyRes.data.data.app_id !== process.env.FACEBOOK_APP_ID) {
      return utils.response(req, res, 400, 'Failed to verify token');
    }

    // Check if the token is valid
    if (verifyRes.data.data.is_valid !== true) {
      return utils.response(req, res, 400, 'Failed to verify token');
    }

    // Get user info
    const userInfo = await utils.http_get('https://graph.facebook.com/me?fields=id,name,email&access_token=' +
      req.body.loginData.accessToken
    )
      .catch(err => {
        return utils.response(req, res, 400, {error: 'Failed to verify token'});
      });

    if (!userInfo.data.email) {
      return utils.response(req, res, 400, 'No email associated');
    }
    req.body.facebook_user = userInfo.data;
    req.body.email = userInfo.data.email;
    next();
  }
  else if (req.body.provider === 'apple'){
    const auth = new AppleAuth({
        client_id: req.body.useBundleId === "true" 
          ? process.env.APPLE_PACKAGE_IDENTIFIER 
          : process.env.APPLE_SIGNIN_SERVICE_ID,
        team_id: process.env.APPLE_SIGNIN_TEAM_ID,
        redirect_uri: req.body.isWeb === "true" 
          ? process.env.APPLE_SIGNIN_REDIRECT_URL_WEB 
          : process.env.APPLE_SIGNIN_REDIRECT_URL,
        key_id: process.env.APPLE_SIGNIN_KEY_ID
      },
      process.env.APPLE_SIGNIN_KEY_CONTENTS.replace(/\|/g, "\n"),
      "text"
    );
      
    try{
      const accessToken = await auth.accessToken(req.body.loginData);
      const idToken = jwt.decode(accessToken.id_token);
      // Unique identifier
      req.body.apple_id_token = idToken.sub;
      // userName will only be provided for the initial authorization
      req.body.apple_user = `${req.body.firstName} ${req.body.lastName}`;
      req.body.email = idToken.email;
      next();
    }catch(err){
      return utils.response(req, res, 400, 'Failed to verify token');
    }
  }
  else {
    return utils.response(req, res, 400, 'Invalid provider');
  }
}

function apple_signin_callback(req, res, next) {
  // Callback for sign in with apple on Android devices
  const redirect = `intent://callback?${new URLSearchParams(
      req.body
    ).toString()}#Intent;package=${
      process.env.ANDROID_PACKAGE_IDENTIFIER
    };scheme=signinwithapple;end`;
  return res.redirect(307, redirect);
}

function create_user(req, res, next) {
  let user_name, provider;

  if (req.body.provider === 'google') {
    user_name = req.body.google_user.name;
    provider = 'google';
  }
  else if (req.body.provider === 'facebook') {
    user_name = req.body.facebook_user.name;
    provider = 'facebook';
  }
  else if (req.body.provider === 'apple') {
    user_name = req.body.apple_user;
    provider = 'apple';
  }
  else {
    return utils.response(req, res, 400, 'Invalid provider');
  }

  return User.create({
    user_name: user_name,
    email: req.body.email,
    provider: provider,
    bio: process.env.DEFAULT_BIO,
    created_at: new Date(),
    posts: [],
  });
}

function get_user(req, res, next) {
  const user_id = req.params.id;

  User.findOne({ _id: user_id }, "bio profile_image user_name email", (err, user) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    if (!user) {
      return utils.response(req, res, 404, {error: 'User not found'});
    }

    return utils.response(req, res, 200, user);
  });
}

function delete_account(req, res, next) {
  const userId = req.body.auth_user_id;

  User.findOneAndDelete({ _id: userId }, async (err, user) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    if (!user) {
      return utils.response(req, res, 404, {error: 'User not found'});
    }

    // Delete all posts
    await Post.deleteMany({ posterId: userId });

    // Delete all comments
    await Comment.deleteMany({ userId: userId });

    // Delete all favorites
    await Favourite.deleteMany({ userId: userId });

    // Delete all follower information
    await Follower.deleteMany({ from: userId });
    await Follower.deleteMany({ to: userId });

    // Delete all tokens
    await Token.deleteMany({ user_id: userId });

    return utils.response(req, res, 200, {message: 'User deleted'});
  });
}

function login(req, res, next) {
  // Match the email to a user
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    if (user) {
      req.body.auth_user_id = user;
      next();
    }
    else {
      create_user(req, res)
        .then(user => {
          req.body.auth_user_id = user;
          next();
        })
        .catch(err => {
          return utils.response(req, res, 500, {error: 'Internal server error'});
        });
    }
  });
}

async function editProfile(req, res, next){
  if (!utils.check_body_fields(req.body, ['userName', 'bio'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  if (typeof(req.body.userName) != 'string'){
    return utils.response(req, res, 400, {error: 'Wrong userName type'});
  }

  if (typeof(req.body.bio) != 'string'){
    return utils.response(req, res, 400, {error: 'Wrong bio type'});
  }

  if (req.body.userName.length > 30) {
    return utils.response(req, res, 400, {error: 'Username is too long'});
  }

  if (req.body.bio.length > 250) {
    return utils.response(req, res, 400, {error: 'Bio is too long'});
  }

  const user = await User.findOneAndUpdate({ _id : req.body.auth_user_id }, { "$set": { 
    user_name: req.body.userName, 
    bio: req.body.bio
  }}, { new: true}).catch(err => {
    return utils.response(req, res, 500, {error: 'Internal server error'});
  })

  return utils.response(req, res, 200, user);
}

async function profile_image_upload(req, res, next) {
  const fs = require('fs');
  const path = require('path');

  const oldImage = await Image.findOne({
    uploaderId: req.body.auth_user_id
  });
  if (!req.files || !req.files.image || Object.keys(req.files).length === 0) {
    return utils.response(req, res, 400, {error: 'No files were uploaded'})
  }
  if (req.files.image.size > Number(process.env.UPLOAD_IMAGE_SIZE)) {
    return utils.response(req, res, 400, {error: 'Image is too large'});
  }

  const newImage = new Image({
    uploaderId: req.body.auth_user_id,
    originalFilename: req.files.image.name,
  });

  newImage.save((err, image) => {
    if (err || !image) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    const file_name = image._id + '.png';
    req.files.image.mv(process.env.PROFILE_UPLOAD_PATH + file_name)
      .then(() => {
        if (oldImage) {
          fs.unlink(process.env.PROFILE_UPLOAD_PATH + oldImage._id.toString() + '.png', (err) => {});
        }

        User.findOneAndUpdate({ _id: req.body.auth_user_id }, { "$set": {
          profile_image: file_name
        }}, { new: true})
          .then(user => {
            return utils.response(req, res, 201, {message: 'Image uploaded', imageId: image._id});
          })
          .catch(err => {
            return utils.response(req, res, 500, {error: 'Internal server error'});
          });
      })
      .catch(err => {
        return utils.response(req, res, 500, {error: 'Internal server error'});
      });
  });
}

module.exports = {
  get_user: get_user,
  delete_account: delete_account,
  login: login,
  editProfile: editProfile,
  verify_oauth_token: verify_oauth_token,
  profile_image_upload: profile_image_upload,
  apple_signin_callback: apple_signin_callback
};
