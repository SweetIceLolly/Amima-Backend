const Followers = require('../models/follower');
const db = require('mongoose');
const tokensController = require('../controllers/tokens');

let ws_connections = {};   // A mapping from userId to a list of ws connections

function follower_ws_handler(ws) {
  let userId = '';

  ws.on('connection', function(ws, req) {
    console.log(req);
  });

  ws.on('message', function(msg) {
    ws.send(msg);
  });

  ws.on('close', function() {

  });

  ws.on('error', function(err) {

  });
}

async function new_follow(req, res, next) {

}

async function remove_follow(req, res, next) {

}

async function get_followers_count(req, res, next) {

}

async function notify_users(subscription_type) {

}

module.exports = {
  follower_ws_handler: follower_ws_handler,
  new_follow: new_follow,
  remove_follow: remove_follow,
  get_followers_count: get_followers_count,
  notify_users: notify_users
}
