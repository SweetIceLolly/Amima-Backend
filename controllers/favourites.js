const Favourites = require('../models/favourite');
const db = require('mongoose');
const utils = require("../utils");
const Users = require("../models/user");
const Posts = require("../models/post");
const FollowersController = require("./followers");

async function get_favPost_by_userId(req, res, next) {
  const userId = req.params.user;

  if (!db.Types.ObjectId.isValid(userId)) {
    return utils.response(req, res, 400, { error: 'Invalid User ID' });
  }

  Favourites.find({ userId: userId }, (err, favourites) => {
    if (err) {
      return utils.response(req, res, 500, { error: 'Internal server error' });
    }
    return utils.response(req, res, 200, favourites.map(favourite => favourite.postId).filter(postId => db.Types.ObjectId.isValid(postId)));
  }).populate({path: 'postId', populate: {path: 'posterId', select: 'user_name profile_image'}});
}

async function add_favourite_post(req, res, next) {
  if (!utils.check_body_fields(req.body, ['post_id'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  // Check if the user has that favourite post before
  const prev_favorite = await Favourites.findOne({ userId: req.body.auth_user_id, postId: req.body.post_id });
  if (prev_favorite) {
    return utils.response(req, res, 400, {error: 'Post already favourited'});
  }

  const targetPost = await Posts.findOne({ _id: req.body.post_id }, {_id: 0, title: 1});
  if (!targetPost) {
    return utils.response(req, res, 404, {error: 'Post not found'});
  }

  const new_favorite = new Favourites({
    userId: req.body.auth_user_id,
    postId: req.body.post_id
  });

  new_favorite.save()
    .then(() => {
      Users.findOne({_id: req.body.auth_user_id}, {_id: 0, user_name: 1})
        .then(user => {
          FollowersController.notify_users('favourite', {
            user: req.body.auth_user_id,
            post_id: req.body.post_id,
            user_name: user.user_name,
            post_title: targetPost.title,
          });
        });

      return utils.response(req, res, 200, {message: 'Post favourited'});
    })
    .catch(err => {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    });
}

async function delete_favourite_post(req, res, next) {
  const postId = req.params.id;

  Favourites.deleteOne({ userId: req.body.auth_user_id, postId: postId }, (err, favourite) => {
    if (err) {
      return utils.response(req, res, 500, { error: 'Internal server error' });
    }
    if (!favourite) {
      return utils.response(req, res, 404, { error: 'Favourite not found' });
    }

    return utils.response(req, res, 200, {message: 'Favourite deleted'});
  });
}

async function check_favourite_post(req, res, next) {
  const postId = req.params.postId;

  if (!db.Types.ObjectId.isValid(postId)) {
    return utils.response(req, res, 400, { error: 'Invalid Post ID' });
  }

  Favourites.findOne({ userId: req.body.auth_user_id, postId: postId }, (err, favourite) => {
    if (err) {
      return utils.response(req, res, 500, { error: 'Internal server error' });
    }

    // Return true if the user has that favourite post
    return utils.response(req, res, 200, {check: (favourite !== null)});
  });
}

function favourite_counter(req, res, next) {
  const postId = req.params.postId;
  Favourites.countDocuments({ postId: postId }, (err, count) => {
    if (err) {
      return utils.response(req, res, 500, { error: 'Internal server error' });
    }

    return utils.response(req, res, 200, {count: count});
  });
}

module.exports = {
  get_favPost_by_userId: get_favPost_by_userId,
  add_favourite_post: add_favourite_post,
  delete_favourite_post: delete_favourite_post,
  check_favourite_post: check_favourite_post,
  favourite_counter: favourite_counter
}
