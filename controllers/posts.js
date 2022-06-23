const Post = require('../models/post');
const Favourites = require('../models/favourite');
const utils = require('../utils');
const Image = require('../models/image');
const db = require('mongoose');

function create_post(req, res, next) {
  if (!utils.check_body_fields(req.body, ['auth_user_id', 'title', 'content', 'images', 'keywords'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }
  
  if (typeof (req.body.title) != "string" ||
      typeof (req.body.content) != "string" ||
      !Array.isArray(req.body.images) ||
      !Array.isArray(req.body.keywords)) {
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
  if (req.body.title.length > 150) {
    return utils.response(req, res, 400, {error: 'Title is too long'});
  }

  // Check if content is too long
  if (req.body.content.length > 2000) {
    return utils.response(req, res, 400, {error: 'Content is too long'});
  }

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
    keywords: req.body.keywords,
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

function get_post(req, res, next) {
  const postId = req.params.id;

  if (!db.Types.ObjectId.isValid(postId)){
    return res.status(400).json({
      error: 'Wrong get Post ID'
    });
  }

  Post.findOne({ _id: postId }, (err, post) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    if (!post) {
      return utils.response(req, res, 404, {error: 'Post not found'});
    }

    return utils.response(req, res, 200, post);
  }).populate('posterId', 'user_name profile_image bio');
}

function search_post(req, res, next) {
  const searchTerm = req.query.searchterm;

  if (typeof(searchTerm) != 'string'){
    return utils.response(req, res, 400, {error: 'Wrong searchterm type'});
  }
  
  const searchRegex = new RegExp('.*' + utils.sanitize_search_term(searchTerm) + ".*", 'i');
  const skipCount = req.query.count || 0;

  Post.find({ $or: [
    { content: { $regex: searchRegex } }, 
    { title: { $regex: searchRegex } },
    { keywords: { $regex: searchRegex } },
  ]}, (err, posts) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    return utils.response(req, res, 200, posts);
  }, {skip: skipCount, limit: 20}).populate('posterId', 'user_name profile_image').sort({postDate: -1});
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
  
  if (skipCount && typeof(skipCount) != 'number'){
    return utils.response(req, res, 400, {error: 'Wrong skipCount type'});
  }

  if (!db.Types.ObjectId.isValid(userId)){
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
  }, {skip: skipCount, limit:20}).populate('posterId').sort({postDate:-1});
}

function delete_post(req, res, next) {
  const postId = req.params.id;

  if (!db.Types.ObjectId.isValid(postId)){
    return res.status(400).json({
      error: 'Invalid Post ID'
    });
  }

  Post.findOne({ _id: postId }, (err, post) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }

    if (!post) {
      return utils.response(req, res, 404, {error: 'Post not found'});
    }

    if (post.posterId.toString() !== req.body.auth_user_id.toString()) {
      return utils.response(req, res, 403, {error: 'Not authorized'});
    }

    // Also delete all favorites associated with this post
    Favourites.deleteMany({ postId: postId });

    post.remove((err, post) => {
      if (err) {
        utils.response(req, res, 500, {error: 'Internal server error'});
      }

      utils.response(req, res, 200, {message: 'Post deleted'});
    });
  });
}

function get_newest_posts(req, res, next) {
  const skipCount = parseInt(req.query.count) || 0;

  if (typeof(skipCount) != 'number'){
    return utils.response(req, res, 400, {error: 'Invalid skipCount type'});
  }

  Post
    .find()
    .populate('posterId', 'user_name profile_image')
    .sort({postDate: -1})
    .skip(skipCount)
    .limit(20)
    .exec(function(err, posts) {
      if (err) {
        return utils.response(req, res, 500, {error: 'Internal server error'});
      }
      return utils.response(req, res, 200, posts);
    });
}

function edit_post(req, res, next) {
  if (!utils.check_body_fields(req.body, [ '_id', 'auth_user_id', 'title', 'content', 'images','keywords'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  if (!db.Types.ObjectId.isValid(req.body._id)){
    return res.status(400).json({
      error: 'Invalid Post ID'
    });
  }

  if (typeof (req.body.title) != "string" ||
      typeof (req.body.content) != "string" ||
      !Array.isArray(req.body.images) ||
      !Array.isArray(req.body.keywords)) {
        return utils.response(req, res, 400, {error: 'Invalid type of edit'});
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
  if (req.body.title.length > 150) {
    return utils.response(req, res, 400, {error: 'Title is too long'});
  }

  // Check if content is too long
  if (req.body.content.length > 2000) {
    return utils.response(req, res, 400, {error: 'Content is too long'});
  }

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

  Post.findOneAndUpdate({ _id : req.body._id }, { "$set": {
    title: req.body.title,  
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

  if (db.Types.ObjectId.isValid(imageId) == false){
    return res.status(400).json({
      error: 'Invalid Image ID'
    });
  }

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
