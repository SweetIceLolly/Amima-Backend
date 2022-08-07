const Followers = require('../models/follower');
const db = require('mongoose');
const tokensController = require('../controllers/tokens');

let ws_connections = {};   // A mapping from userId to a list of ws connections

function follower_ws_handler(ws) {
  let userId = '';

  ws.on('message', async function(msg) {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'auth') {
        const token = data.token;
        if (!token) {
          ws._socket.destroy();
        }
        const login_token = await tokensController.is_token_valid(token);
        if (!login_token) {
          ws._socket.destroy();
        } else {
          userId = login_token.user_id.toString();
          clearTimeout(ws._socket.timeoutTicket);
          if (!ws_connections[userId]) {
            ws_connections[userId] = [];
          }
          ws_connections[userId].push(ws);
        }
      } else {
        ws._socket.destroy();
      }
    }
    catch (e) {
      ws._socket.destroy();
    }
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
