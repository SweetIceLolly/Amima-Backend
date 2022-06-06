const axios = require('axios');

const Image = require('../models/image');
const User = require('../models/user');
const Token = require('../models/token');
const Log = require('../models/log');
const Post = require('../models/post');

const fs = require('fs');
const mongoose = require("mongoose");

/*
  =====================================================
  HTTP request related utility functions
  =====================================================
 */

async function http_get(url, token = undefined) {
  return await axios.get(url, {
    headers: {
      'auth': `${token}`
    }
  });
}

async function http_post(url, payload, token = undefined) {
  return await axios.post(url, payload, {
    headers: {
      'auth': `${token}`
    }
  });
}

async function http_delete(url, token = undefined) {
  return await axios.delete(url, {
    headers: {
      'auth': `${token}`
    }
  });
}

/*
  =====================================================
  File system related utility functions
  =====================================================
 */
function file_exists(filePath) {
  return fs.existsSync(filePath);
}

/*
  =====================================================
  Database related utility functions
  =====================================================
 */
async function db_connect() {
  await mongoose.connect(process.env.DB_URI);
}

async function db_drop_everything() {
  let promises = [];

  promises.push(Post.collection.drop());
  promises.push(User.collection.drop());
  promises.push(Token.collection.drop());
  promises.push(Log.collection.drop());
  promises.push(Image.collection.drop());

  await Promise.all(promises);
}

/*
  =====================================================
  Export utility functions
  =====================================================
 */
module.exports = {
  http_get: http_get,
  http_post: http_post,
  http_delete: http_delete,
  file_exists: file_exists,
  db_connect: db_connect,
  db_drop_everything: db_drop_everything,
  Post: Post,
  User: User,
  Token: Token,
  Log: Log,
  Image: Image
}
