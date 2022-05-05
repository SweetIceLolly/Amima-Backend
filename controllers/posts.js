const Post = require('../models/post');

function create_post(req, res, next) {
  console.log(req.body);
  res.send('create_post');
}

function get_post(req, res, next) {
  res.send('get_post');
}

module.exports = {
  create_post: create_post,
  get_post: get_post
}
