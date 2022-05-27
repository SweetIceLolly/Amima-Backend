const { param } = require('express/lib/request');
const Post = require('../models/post');
const utils = require('../utils');
const Image = require('../models/image');
const routers = require('../routers');
const db = require('mongoose');

function create_post(req, res, next) {
  if (!utils.check_body_fields(req.body, ['auth_user_id', 'title', 'content', 'images', 'keywords'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }
  
  if (typeof (req.body.auth_user_id) != "string" || 
      typeof (req.body.title) != "string" ||
      typeof (req.body.content) != "string" ||
      Array.isArray(req.body.images) == false ||
      Array.isArray(req.body.keywords) == false) {
        return utils.response(req, res, 400, {error: 'Invalid type of post'});
  }
     
  // Need 1 to 10 images
  if (req.body.images.length < 1 || req.body.images.length > 10) {
    return utils.response(req, res, 400, {error: 'Invalid number of images'});
  }

  // Check type of elements in images[] array
  for (let i = 0; i < (req.body.images).length; i++) { 
    if (typeof((req.body.images)[i]) != 'string') {
      return utils.response(req, res, 400, {error: 'Invalid type of images'});
    }
  }

  // Check if title is too long
  if (req.body.title.length > 25) {
    return utils.response(req, res, 400, {error: 'Title is too long'});
  }

  // Check if content is too long
  if (req.body.content.length > 2000) {
    return utils.response(req, res, 400, {error: 'Content is too long'});
  }

  // Validate the image paths
  // TODO

  // Check if there are too many keywords
  if (req.body.keywords.length > 10) {
    return utils.response(req, res, 400, {error: 'Too many keywords'});
  }

  // Check type of elements in keywords[] array
  for (let i = 0; i < (req.body.keywords).length; i++) { 
    if (typeof((req.body.keywords)[i]) != 'string') {
      return utils.response(req, res, 400, {error: 'Invalid type of keywords'});
    }
  }

  // Check if keywords are valid
  for (let keyword of req.body.keywords) {
    if (!utils.is_valid_keyword(keyword)) {
      return utils.response(req, res, 400, {error: 'Invalid keywords'});
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
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    return utils.response(req, res, 201, {message: 'Post created', postId: post._id });

  });
}
//get information about the posts, gets the post id
function get_post(req, res, next) {
  const postId = req.params.id;

  Post.findOne({ _id: postId }, (err, post) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    if (!post) {
      return utils.response(req, res, 404, {error: 'Post not found'});
    }

    return utils.response(req, res, 200, post); //check needed
  });
}

function search_post(req, res, next) {
  var searchTerm = req.query.searchterm;
  var searchRegex = new RegExp('.*' + searchTerm + ".*"); //searches for any string
  const skipCount = req.query.count || 0;

  Post.find({ $or: [
    { content: { $regex: searchRegex } }, 
    { title: {$regex: searchRegex} }
  ]}, (err, posts) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    return utils.response(req, res, 200, posts);
  }, {skip: skipCount, limit: 20}).sort({postDate:-1});
}

function upload_image(req, res, next) {
  if (!req.files || !req.files.image || Object.keys(req.files).length === 0) {
    return utils.response(req, res, 400, {error: 'No files were uploaded'})
  }

  // Reject if the image is too large
  if (req.files.image.size > Number(process.env.UPLOAD_IMAGE_SIZE)) {
    return utils.response(req, res, 400, {error: 'Image is too large'});
  }

  const image = new Image({
    uploaderId: req.body.auth_user_id,
    timestamp: Date.now(),
    originalFilename: req.files.image.name,
  });

  image.save((err, image) => {
    if (err || !image) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    const file_name = image._id + '.png';
    req.files.image.mv(process.env.UPLOAD_PATH + file_name)
      .then(() => {
        return utils.response(req, res, 201, {message: 'Image uploaded', imageId: image._id});
      })
      .catch((err) => {
        return utils.response(req, res, 500, {error: 'Internal server error'});
      });
  });
}

function get_post_by_userId(req, res, next) {
  const userId = req.params.id;
  const skipCount = req.query.count;
  
  var ObjectId = require('mongoose').Types.ObjectId;
  if (ObjectId.isValid(userId) == false){
    return res.status(400).json({
      error: 'Invalid User ID'
    });
  }

  Post.find({ posterId: userId }, (err, posts) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }

    return res.status(200).json(posts)
  }, {skip: skipCount, limit:20}).sort({postDate:-1});
}

function delete_post(req, res, next) {
  const postId = req.params.id;

  Post.deleteOne({user: req.auth_user_id, _id: postId})
    .then(() => {
      return res.status(200).json({
        message: 'Post deleted'
      });
    })
    .catch(err => {
      return res.status(500).json({
        error: 'Internal server error'
      });
    });
}

function get_newest_posts(req, res, next) {
  const skipCount = req.query.count || 0;
  Post.find((err, post) => {
    if (err) {
      return utils.response(req, res, 500, utils.response(req, res, 500, {error: 'Internal server error'}));
    }
    return utils.response(req, res, 200, post);
  }, {skip: skipCount, limit:20}).sort({postDate:-1});
}

function edit_post(req, res, next) {
  if (!utils.check_body_fields(req.body, ['title', 'body', 'content', 'images','keywords'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  User.findOneAndUpdate({ _id : req.body.auth_user_id }, { "$set": {
    title: req.body.title, 
    body: req.body.body, 
    content: req.body.content,
    images: req.body.images,
    keywords: req.body.keywords
  }}).exec(function(err, post) {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    } else {
      return utils.response(req, res, 200, post);
    }
 });
}
function delete_post_image(req, res, next){
  const imageId = req.params.id;

  Image.deleteOne({_id: imageId})
    .then(() => {
      return res.status(200).json();
    })
    .catch(err => {
      return res.status(500).json({
        error: 'Internal server error'
      });
    });
}

module.exports = {
  create_post: create_post,
  get_post: get_post,
  get_post_by_userId: get_post_by_userId,
  delete_post: delete_post,
  upload_image: upload_image,
  get_newest_posts: get_newest_posts,
  search_post: search_post,
  edit_post: edit_post,
  delete_post_image
}
