const postsController = require('./controllers/posts');
const usersController = require('./controllers/users');
const tokensController = require('./controllers/tokens');
const commentsController = require('./controllers/comments');
const favouritesController = require('./controllers/favourites');

function init_router(app) {
  app.post('/post', tokensController.check_login_token, tokensController.renew_token, postsController.create_post);
  app.get('/post/:id', postsController.get_post);
  app.delete('/deletepost/:id', tokensController.check_login_token, tokensController.renew_token, postsController.delete_post);
  app.get('/postbyuser/:id', postsController.get_post_by_userId);
  app.post('/postimage', tokensController.check_login_token, tokensController.renew_token, postsController.upload_image);
  app.post('/profileimage', tokensController.check_login_token, tokensController.renew_token, usersController.profile_image_upload);
  app.get('/user/:id', usersController.get_user);
  app.post('/login', usersController.verify_oauth_token, usersController.login, tokensController.create_token);
  app.post('/appleSigninCallback', usersController.apple_signin_callback);
  app.get('/searchPost', postsController.search_post);
  app.get('/newestposts', postsController.get_newest_posts);
  app.get('/filterposts', postsController.get_newest_posts_category);
  app.post('/editProfile', tokensController.check_login_token, tokensController.renew_token, usersController.editProfile);
  app.post('/editPost', tokensController.check_login_token, tokensController.renew_token, postsController.edit_post);
  app.delete('/deletePostImage/:id', postsController.delete_post_image);
  app.delete('/logout', tokensController.check_login_token, tokensController.delete_token);
  app.post('/favourite', tokensController.check_login_token, tokensController.renew_token, favouritesController.add_favourite_post);
  app.get('/favourite/:user', favouritesController.get_favPost_by_userId);
  app.get('/favouriteCount/:postId', favouritesController.favourite_counter);
  app.get('/checkFavourite/:postId', tokensController.check_login_token, tokensController.renew_token, favouritesController.check_favourite_post);
  app.delete('/favourite/:id', tokensController.check_login_token, tokensController.renew_token, favouritesController.delete_favourite_post);
  app.get('/comments/:id', commentsController.get_comments);
  app.post('/comment', tokensController.check_login_token, tokensController.renew_token, commentsController.create_comment);
  app.delete('/deletecomment/:commentId', tokensController.check_login_token, tokensController.renew_token, commentsController.delete_comment);
}

module.exports = {
  init_router: init_router
}
