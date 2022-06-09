const Comment = require('../models/comment');
const utils = require('../utils');
const db = require('mongoose');

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