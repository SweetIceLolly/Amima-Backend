const Followers = require('../models/follower');
const Users = require('../models/user');
const db = require('mongoose');
const tokensController = require('../controllers/tokens');
const utils = require("../utils");

let ws_connections = {};   // A mapping from userId to a list of websocket connections

function follower_ws_handler(ws) {
  let userId = '';

  ws.on('message', async function(msg) {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'auth') {
        if (userId) {
          return;
        }
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
          ws.send(JSON.stringify({ type: 'auth_success' }));
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
    if (ws_connections[userId]) {
      ws_connections[userId] = ws_connections[userId].filter(w => w !== ws && w.readyState === 1);
    }
  });

  ws.on('error', function(err) {
    if (ws_connections[userId]) {
      ws_connections[userId] = ws_connections[userId].filter(w => w !== ws && w.readyState === 1);
    }
  });
}

async function new_follow(req, res, next) {
  if (!utils.check_body_fields(req.body, ['follow_to'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  // Check if the id is valid
  if (!db.Types.ObjectId.isValid(req.body.follow_to)) {
    return utils.response(req, res, 400, {error: 'Invalid User ID'});
  }

  const from = req.auth_user_id.toString();
  const to = req.body.follow_to;

  // Check if the user already has that following
  const prev_follow = await Followers.findOne({ from: from, to: to });
  if (prev_follow) {
    return utils.response(req, res, 400, {error: 'Already following'});
  }

  const follow_entry = new Followers({
    from: from,
    to: to
  });

  const from_user = await Users.findOne({ _id: from }, { _id: false, user_name: true });
  const to_user = await Users.findOne({ _id: to }, { _id: false, user_name: true });

  notify_users('followed_by', { from: from, to: to, from_name: from_user.user_name, to_name: to_user.user_name });
  notify_users('follow_to', { from: from, to: to, from_name: from_user.user_name, to_name: to_user.user_name });

  follow_entry.save()
    .then(() => {
      return utils.response(req, res, 200, {message: 'Followed'});
    })
    .catch(err => {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    });
}

async function remove_follow(req, res, next) {
  if (!utils.check_body_fields(req.body, ['unfollow_to'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  // Check if the id is valid
  if (!db.Types.ObjectId.isValid(req.body.unfollow_to)) {
    return utils.response(req, res, 400, {error: 'Invalid User ID'});
  }

  const from = req.auth_user_id;
  const to = req.body.unfollow_to;

  // Remove the follow
  Followers.deleteOne({ from: from, to: to })
    .then(() => {
      return utils.response(req, res, 200, {message: 'Unfollowed'});
    })
    .catch(err => {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    });
}

async function is_followed(req, res, next) {
  const from = req.auth_user_id;
  const to = req.params.to;

  // Check if the id is valid
  if (!db.Types.ObjectId.isValid(to)) {
    return utils.response(req, res, 400, {error: 'Invalid User ID'});
  }

  const followed = await Followers.findOne({ from: from, to: to });
  return utils.response(req, res, 200, {followed: !!followed});
}

async function get_followers(req, res, next) {
  const userId = req.auth_user_id;
  const users = await Followers.find({ to: userId }, '-_id -to -followed_at -__v').populate('from', 'user_name profile_image');
  return utils.response(req, res, 200, users);
}

async function get_followed_users(req, res, next) {
  const userId = req.auth_user_id;
  const users = await Followers.find({ from: userId }, '-_id -from -followed_at -__v').populate('to', 'user_name profile_image');
  return utils.response(req, res, 200, users);
}

async function change_subscription(req, res, next) {
  if (!utils.check_body_fields(req.body, ['follow_to', 'subs'])) {
    return utils.response(req, res, 400, {error: 'Missing required fields'});
  }

  // Check if the id is valid
  if (!db.Types.ObjectId.isValid(req.body.follow_to)) {
    return utils.response(req, res, 400, {error: 'Invalid User ID'});
  }

  const from = req.auth_user_id;
  const to = req.body.follow_to;

  // Check if the user already has that following
  const prev_follow = await Followers.findOne({ from: from, to: to });
  if (!prev_follow) {
    return utils.response(req, res, 400, {error: 'Not following'});
  }

  // Change the subscription type
  prev_follow.sub_post = !!req.body.subs.post;
  prev_follow.sub_comment = !!req.body.subs.comment;
  prev_follow.sub_favourite = !!req.body.subs.favourite;
  prev_follow.sub_follow = !!req.body.subs.follow;

  // Save the changes
  prev_follow.save()
    .then(() => {
      return utils.response(req, res, 200, {message: 'Subscription changed'});
    })
    .catch(err => {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    });
}

async function get_followers_count(req, res, next) {
  const target = req.params.user_id;

  // Check if the id is valid
  if (!db.Types.ObjectId.isValid(target)) {
    return utils.response(req, res, 400, {error: 'Invalid User ID'});
  }

  const count = await Followers.count({ to: target });
  return utils.response(req, res, 200, {count: count});
}

/**
 * Send a JSON data to all the users that have the specified subscription
 * @param subscription_type: the type of subscription to send. Can be one of:
 *  post:         Notify the users who want to receive notifications when a post is created by their followed users
 *  comment:      Notify the users who want to receive notifications when a comment is created by their followed users
 *  favourite:    Notify the users who want to receive notifications when a post is favourited by their followed users
 *  follow_to:    Notify the users who want to receive notifications when their followed user starts following another user
 *  followed_by:  Notify the user when another user starts following them
 * @param data: Additional data specified by the subscription type:
 *  post:         user: the user who created the post; post_id: the id of the post; user_name; post_title
 *  comment:      user: the user who created the comment; post_id: the id of the post; comment_id: the id of the comment; user_name; post_title
 *  favourite:    user: the user who favourited the post; post_id: the id of the post; user_name; post_title
 *  follow_to:    from; to; from_name; to_name
 *  followed_by:  from; to; from_name; to_name
 * @returns {Promise<void>}
 */
async function notify_users(subscription_type, data) {
  let filters = {$and: []};

  switch (subscription_type) {
    case 'post':
      filters.$and.push({sub_post: true});
      filters.$and.push({to: data.user.toString()});
      break;

    case 'comment':
      filters.$and.push({sub_comment: true});
      filters.$and.push({to: data.user.toString()});
      break;

    case 'favourite':
      filters.$and.push({sub_favourite: true});
      filters.$and.push({to: data.user.toString()});
      break;

    case 'follow_to':
      filters.$and.push({sub_follow: true});
      filters.$and.push({to: data.from.toString()});
      break;
  }

  let users;
  if (subscription_type === 'followed_by') {
    users = [data.to];
  } else {
    users = (await Followers.find(filters)).map(followingInfo => followingInfo.from.toString());
  }

  for (const user of users) {
    const user_connections = ws_connections[user];
    if (user_connections) {
      for (const ws of user_connections) {
        ws.send(JSON.stringify({
          type: subscription_type,
          data: data
        }));
      }
    }
  }
}

module.exports = {
  follower_ws_handler: follower_ws_handler,
  new_follow: new_follow,
  remove_follow: remove_follow,
  get_followers: get_followers,
  get_followed_users: get_followed_users,
  change_subscription: change_subscription,
  get_followers_count: get_followers_count,
  is_followed: is_followed,
  notify_users: notify_users
}
