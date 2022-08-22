const db = require('mongoose');
const Comment = require('../models/comment');
const User = require('../models/user');
const Post = require('../models/post');
const utils = require('../utils');
const Users = require("../models/user");
const FollowersController = require("./followers");

function get_comments(req, res, next) {
	const post_Id = req.params.id;
	Comment.find({ postId: post_Id }, (err, comments) => {
			if (err) {
			return utils.response(req, res, 500, {error: 'Internal server error'});
			}

			if (!comments) {
			return utils.response(req, res, 204, {error: 'No Comments Posted'});
			}

			return utils.response(req, res, 200, comments);
	}).populate('userId', 'profile_image user_name').sort({created_at:-1});
}

async function create_comment(req, res, next) {
  if (!utils.check_body_fields(req.body, ['auth_user_id', 'content', 'postId'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  if (typeof (req.body.content) != "string") {
    return utils.response(req, res, 400, {error: 'Invalid type of content'});
  }

  if (!db.Types.ObjectId.isValid(req.body.postId)){
    return utils.response(req, res, 400, {error: 'Invalid type of postId'});
  }

  // Check if content is too long
  if (req.body.content.length > 1500) {
    return utils.response(req, res, 400, {error: 'Content is too long'});
  }

  const targetPost = await Post.findOne({ _id: req.body.postId }, { _id: 0, title: 1 });
  if (!targetPost) {
    return utils.response(req, res, 404, {error: 'Post not found'});
  }

  const comment = new Comment({
    content: req.body.content,
    postId: req.body.postId,
    userId: req.body.auth_user_id
  });

  comment.save(async (err, comment) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    Users.findOne({_id: req.body.auth_user_id}, {_id: 0, user_name: 1})
      .then(user => {
        FollowersController.notify_users('comment', {
          user: req.body.auth_user_id,
          post_id: comment.postId,
          comment_id: comment._id,
          user_name: user.user_name,
          post_title: targetPost.title,
        });
      });

    return utils.response(req, res, 201, comment);
  });
}

function delete_comment(req, res, next) {
  const commentId = req.params.commentId;
  
  if (!db.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({
      error: 'Invalid Comment ID'
    });
  }

  Comment.findOne({ _id: commentId }, (err, comment) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    if (!comment) {
      return utils.response(req, res, 404, {error: 'Comment not found'});
    }

    if (comment.userId.toString() !== req.body.auth_user_id.toString()) {
      return utils.response(req, res, 403, {error: 'You are not allowed to delete this comment'});
    }

    comment.remove((err) => {
      if (err) {
        return utils.response(req, res, 500, {error: 'Internal server error'});
      }

      return utils.response(req, res, 200, {message: 'Comment deleted'});
    });
  });
}

module.exports = {
  create_comment: create_comment,
  delete_comment: delete_comment,
  get_comments: get_comments,
}
