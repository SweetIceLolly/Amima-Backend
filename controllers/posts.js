const { param } = require('express/lib/request');
const Post = require('../models/post');
const utils = require('../utils');
const Image = require('../models/image');

function create_post(req, res, next) {
  if (!utils.check_body_fields(req.body, ['auth_user_id', 'title', 'content', 'images', 'keywords'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  // Need 1 to 10 images
  if (req.body.images.length < 1 || req.body.images.length > 10) {
    return utils.response(req, res, 400, {error: 'Invalid number of images'});
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

    return utils.response(req, res, 200, {post}); //check needed
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
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    return utils.response(req, res, 200, posts);
  });
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
  const userId = req.params.userId;

  Post.find({ posterId: userId }, (err, posts) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
    
    if (!posts) {
      return res.status(404).json({
        error: 'Posts by user not found'
      });
    }

    return res.status(200).json(posts)
  });
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
  Post.find((err, post) => {
    if (err) {
      return utils.response(req, res, 500, utils.response(req, res, 500, {error: 'Internal server error'}));
    }
    return utils.response(req, res, 200, post);
  }).sort({postDate:-1}).limit(20);
}

function edit_post(req, res, next) {
  if (!utils.check_body_fields(req.body, ['title', 'body', 'content', 'images','keywords'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  User.findOneAndUpdate({ _id : req.body.auth_user }, { "$set": {
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

module.exports = {
  create_post: create_post,
  get_post: get_post,
  get_post_by_userId: get_post_by_userId,
  delete_post: delete_post,
  upload_image: upload_image,
  get_newest_posts: get_newest_posts,
  search_post: search_post,
  edit_post: edit_post
}
