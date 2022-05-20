const { param } = require('express/lib/request');
const Post = require('../models/post');
const utils = require('../utils');
const Image = require('../models/image');

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

  // Check if title is too long
  if (req.body.title.length > 25) {
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
//get information about the posts, gets the post id
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

function search_post(req, res, next) {
  var searchTerm = req.query.searchterm;
  var searchRegex = new RegExp('.*' + searchTerm + ".*"); //searches for any string
  
  Post.find({ $or: [
    { content: { $regex: searchRegex } }, 
    { title: {$regex: searchRegex} }
  ]}, (err, posts) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }

    return res.status(200).json(posts);
  });
}

function upload_image(req, res, next) {
  if (!req.files || !req.files.image || Object.keys(req.files).length === 0) {
    return res.status(400).json({
      error: 'No files were uploaded',
    });
  }

  // Reject if the image is too large
  if (req.files.image.size > Number(process.env.UPLOAD_IMAGE_SIZE)) {
    return res.status(400).json({
      error: 'Image is too large',
    });
  }

  const image = new Image({
    uploaderId: req.body.auth_user_id,
    timestamp: Date.now(),
    originalFilename: req.files.image.name,
  });

  image.save((err, image) => {
    if (err || !image) {
      return res.status(500).json({
        error: 'Internal server error',
      });
    }

    const file_name = image._id + '.png';
    req.files.image.mv(process.env.UPLOAD_PATH + file_name)
      .then(() => {
        return res.status(201).json({
          message: 'Image uploaded',
          imageId: image._id,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          error: 'Internal server error',
        });
      });
  });
}

function get_newest_posts(req, res, next) {
  Post.find((err, post) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
    return res.status(200).json(post);
  }).sort({postDate:-1}).limit(20);
}


module.exports = {
  create_post: create_post,
  get_post: get_post,
  upload_image: upload_image,
  get_newest_posts: get_newest_posts,
  search_post: search_post
}
