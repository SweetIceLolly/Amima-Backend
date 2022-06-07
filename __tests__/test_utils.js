const axios = require('axios');

const Image = require('../models/image');
const User = require('../models/user');
const Token = require('../models/token');
const Log = require('../models/log');
const Post = require('../models/post');

const fs = require('fs');
const mongoose = require("mongoose");

require('dotenv').config({ path: __dirname + '/.env' });
const API_URL = process.env.API_URL;

/*
  =====================================================
  User authentication values
  There are two users in the database: Tony and Jenny
  =====================================================
 */
let tony = undefined;
let jenny = undefined;
const TONY_TOKEN = 'tony_token';
const JENNY_TOKEN = 'jenny_token';

/*
  =====================================================
  HTTP request related utility functions
  =====================================================
 */

async function http_get(url, token = undefined) {
  try {
    return await axios.get(url, {
      headers: {
        'auth': `${token}`
      }
    });
  }
  catch (err) {
    throw err.message;
  }
}

async function http_post(url, payload, token = undefined) {
  try {
    return await axios.post(url, payload, {
      headers: {
        'auth': `${token}`
      }
    });
  }
  catch (err) {
    throw err.message;
  }
}

async function http_post_file(url, filePath, token = undefined) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    return await axios.post(url, formData, {
      headers: {
        'auth': `${token}`,
        ...formData.getHeaders()
      }
    });
  }
  catch (err) {
    throw err.message;
  }
}

async function http_delete(url, token = undefined) {
  try {
    return await axios.delete(url, {
      headers: {
        'auth': `${token}`
      }
    });
  }
  catch (err) {
    throw err.message;
  }
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
  return mongoose.connect(process.env.DB_URI);
}

function db_connected() {
  return (mongoose.connection.readyState === 1);
}

function db_disconnect() {
  return mongoose.disconnect();
}

async function db_drop_everything() {
  const droplist = new Set([
    'images',
    'users',
    'logs',
    'posts',
    'login_tokens'
  ]);

  const collections = await mongoose.connection.db.listCollections().toArray();
  for (let collection of collections) {
    if (droplist.has(collection.name)) {
      await mongoose.connection.db.dropCollection(collection.name);
    }
  }
}

async function db_init_content() {
  // Create two users and generate their tokens
  tony = await new User({
    user_name: 'tony',
    email: 'tony@gmail.com',
    profile_image: 'default_avatar.png',
    provider: 'google',
    bio: 'My name is Tony',
    created_at: new Date(),
    favorites: []
  }).save();

  jenny = await new User({
    user_name: 'jenny',
    email: 'jenny@gmail.com',
    profile_image: 'default_avatar.png',
    provider: 'google',
    bio: 'My name is Jenny',
    created_at: new Date(),
    favorites: []
  }).save();

  await new Token({
    user_id: tony._id,
    token: TONY_TOKEN,
    created_at: new Date(),
    expires_at: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7))
  }).save();

  await new Token({
    user_id: jenny._id,
    token: JENNY_TOKEN,
    created_at: new Date(),
    expires_at: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7))
  }).save();

  // For each user, create two posts
  await new Post({
    title: 'Tony\'s 1st post',
    content: 'This is Tony\'s 1st post',
    keywords: ['tony', 'post', '1st'],
    images: ['file1.png'],
    postDate: new Date(),
    posterId: tony._id
  }).save();

  await new Post({
    title: 'Tony\'s 2nd post',
    content: 'This is Tony\'s 2nd post',
    keywords: ['tony', 'post', '2nd'],
    images: ['file2.png'],
    postDate: new Date(),
    posterId: tony._id
  }).save();

  await new Post({
    title: 'Jenny\'s 1st post',
    content: 'This is Jenny\'s 1st post',
    keywords: ['jenny', 'post', '1st'],
    images: ['file3.png'],
    postDate: new Date(),
    posterId: jenny._id
  }).save();

  await new Post({
    title: 'Jenny\'s 2nd post',
    content: 'This is Jenny\'s 2nd post',
    keywords: ['jenny', 'post', '2nd'],
    images: ['file4.png'],
    postDate: new Date(),
    posterId: jenny._id
  }).save();
}

function get_tony() {
  return tony;
}

function get_jenny() {
  return jenny;
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
  db_connected: db_connected,
  db_disconnect: db_disconnect,
  db_drop_everything: db_drop_everything,
  db_init_content: db_init_content,
  Post: Post,
  User: User,
  Token: Token,
  Log: Log,
  Image: Image,
  TONY_TOKEN: TONY_TOKEN,
  JENNY_TOKEN: JENNY_TOKEN,
  get_tony: get_tony,
  get_jenny: get_jenny,
  API_URL: API_URL
}
