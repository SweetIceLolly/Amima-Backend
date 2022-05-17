const Post = require('../models/post');
const utils = require('../utils');

function create_post(req, res, next) {
  if (!utils.check_body_fields(req.body, ['auth_user_id', 'title', 'content', 'images', 'keywords'])) {
    return res.status(400).json({
      error: 'Missing required fields',
    });
  }

  // Need 1 to 10 images
  if (req.body.images.length < 1 || req.body.images.length > 10) {
    return res.status(400).json({
      error: 'Invalid number of images',
    });
  }

  // Check if title is too lon
  if (req.body.title.length > 21) {
    return res.status(400).json({
      error: 'Title is too long',
    });
  }

  // Check if content is too long
  if (req.body.content.length > 2000) {
    return res.status(400).json({
      error: 'Content is too long',
    });
  }

  // Validate the image paths
  // TODO

  // Check if there are too many keywords
  if (req.body.keywords.length > 10) {
    return res.status(400).json({
      error: 'Too many keywords',
    });
  }

  // Check if keywords are valid
  for (let keyword of req.body.keywords) {
    if (!utils.is_valid_keyword(keyword)) {
      return res.status(400).json({
        error: 'Invalid keywords',
      });
    }
  }

  // Create the post
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    images: req.body.images,
    posterId: req.body.auth_user_id,
  });

  post.save((err, post) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal server error',
      });
    }

    return res.status(201).json({
      message: 'Post created',
      postId: post._id,
    });
  });
}

function get_post(req, res, next) {
  const postId = req.params.id;

  Post.findOne({ _id: postId }, (err, post) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    return res.status(200).json(post);   //check needed
  });
}

module.exports = {
  create_post: create_post,
  get_post: get_post
}
