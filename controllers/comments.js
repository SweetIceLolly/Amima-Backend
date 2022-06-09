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

module.exports = {
	get_comments: get_comments,
}
  