const db = require('mongoose');
const Comment = require('../models/comment');
const utils = require('../utils');

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
	}).populate('userId', 'profile_image user_name');
}

function create_comment(req, res, next) {
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
  if (req.body.content.length > 200) {
    return utils.response(req, res, 400, {error: 'Content is too long'});
  }

  const comment = new Comment({
    content: re.body.content,
    postId: re.body.postId,
    userId: re.body.auth_user_id
  });

  comment.save((err, comment) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    return utils.response(req, res, 201, {message: 'Comment created', commentId: comment._id });
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

    if (comment.userId != req.body.auth_user_id) {
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