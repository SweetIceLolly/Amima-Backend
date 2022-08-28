const utils = require('../utils');
const PushToken = require('../models/pushtoken');
var admin = require("firebase-admin");

async function create_token(req, res, next) {
  const user_id = req.body.auth_user_id;
  const push_token = req.body.token;

  PushToken.findOne({ 'user_id': user_id }, (err, user) => {
    if (err) {
      return utils.response(req, res, 500, {error: 'Internal server error'});
    }
    if (user) {
      if (!user.token.includes(push_token)) {
        user.token.push(push_token);
        user.save((err) => {
          if (err) {
            return utils.response(req, res, 500, {error: 'Internal server error'});
          }
        });
      }else{
        return utils.response(req, res, 200, {message: 'Token Existed'});
      }
    }
    else {
      PushToken.create({
        user_id:user_id,
        token: [push_token]
      });
    }
    return utils.response(req, res, 200, {message: 'Token Saved'});
  });
}

async function push_notify_users(user, subscription_type, data) {
  title = "Amima";
  body = "You have a new notification";
  image = "https://amimalive.com/profile_images/default_avatar.png";
  sound = "";
  type = "";
  user_id = "";
  post_id = "";

  switch (subscription_type) {
    case 'post':
      body = data.user_name + " has created a new post: " + data.post_title;
      type = "post";
      post_id = data.post_id.toString();
      break;

    case 'comment':
      body = data.user_name + " has commented on the post: " + data.post_title;
      type = "post";
      post_id = data.post_id.toString();
      break;

    case 'favourite':
      body = data.user_name + " has favourited a post: " + data.post_title;
      type = "post";
      post_id = data.post_id.toString();
      break;

    case 'follow_to':
      body = data.from_name + " has started following " + data.to_name;
      type = "user";
      user_id = data.to.toString();
      break;

    case 'followed_by':
      sound = "default";
      body = data.from_name+" has started following you!";
      type = "user";
      user_id = data.from.toString();
      break;
    
    default:
      break;
  }
  handleFCM(user, title, body, image, sound, type, user_id, post_id);
}

async function initializeFirebaseAdmin(){
  if (admin.apps.length === 0) {
    const serviceAccount = {
      "type": "service_account",
      "project_id": process.env.FIREBASE_PROJECT_ID,
      "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
      "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      "client_email": process.env.FIREBASE_CLIENT_EMAIL,
      "client_id": process.env.FIREBASE_CLIENT_ID,
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
    }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
}

/**
 * Send a notification to the user with FCM token
 * @param userid: receiver user id
 * @param title: notification title
 * @param body: notification body
 * @param image: notification image
 * @param sound: notification sound. Can be one of:
 *  default
 *  empty
 * @param type: notification type. Can be one of:
 *  post:      Notification popup will show a button redirect to the post
 *  user:      Notification popup will show a button redirect to the user profile
 *  empty:     No redirect button will be shown
 * @param user_id: user id of the user to be redirected to
 * @param post_id: post id of the post to be redirected to
 * @returns {Promise<void>}
 */
async function handleFCM(userid, title, body, image, sound, type, user_id, post_id){
  try {
    PushToken.findOne({ 'user_id': userid }, (err, user) => {
      if (err || !user) {
        return;
      }

      initializeFirebaseAdmin();

      const registrationTokens = user.token;
      
      const message = {
        notification: {
          title: title,
          body: body
        },
        android: {
          notification: {
            imageUrl: image
          }
        },
        apns: {
          payload: {
            aps: {
              'mutable-content': 1
            }
          },
          fcm_options: {
            image: image
          }
        },
        webpush: {
          headers: {
            image: image
          }
        },
        data: {
          type: type, 
          post_id: post_id, 
          user_id: user_id
        },
        tokens: registrationTokens,
      };

      if (sound!=""){
        message.apns.payload.aps.push() = {'sound': sound};
        message.android.notification.push() = {'sound': sound};
      }

      admin.messaging().sendMulticast(message);
    });
  }catch(e){};
}

module.exports = {
  create_token: create_token,
  push_notify_users: push_notify_users
};
