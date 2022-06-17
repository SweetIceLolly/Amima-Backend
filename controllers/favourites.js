const Favourites = require('../models/favourite');
const db = require('mongoose');
const utils = require("../utils");

async function get_favPost_by_userId(req, res, next) {
  const userId = req.params.user;

  if (!db.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      error: 'Invalid User ID'
    });
  }

  Favourites.find({ userId: userId }, (err, favourites) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
    return res.status(200).json(favourites);
  }).populate({
    path: 'postId',
    populate: { path: 'posterId' }
  });
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

  const new_favorite = new Favourites({
    userId: req.body.auth_user_id,
    postId: req.body.post_id
  });

  new_favorite.save()
    .then(() => {
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
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
    if (!favourite) {
      return res.status(404).json({
        error: 'Favourite not found'
      });
    }

    return res.status(200).json({
      message: 'Post removed'
    });
  });
}

async function check_favourite_post(req, res, next) {
  const postId = req.params.postId;

  if (!db.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({
      error: 'Invalid Post ID'
    });
  }

  Favourites.findOne({ userId: req.body.auth_user_id, postId: postId }, (err, favourite) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }

    // Return true if the user has that favourite post
    return res.status(200).json({
      check: (favourite !== null)
    });
  });
}

module.exports = {
  get_favPost_by_userId: get_favPost_by_userId,
  add_favourite_post: add_favourite_post,
  delete_favourite_post: delete_favourite_post,
  check_favourite_post: check_favourite_post
}
