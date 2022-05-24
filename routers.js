const postsController = require('./controllers/posts');
const usersController = require('./controllers/users');
const tokensController = require('./controllers/tokens');

function init_router(app) {
  app.post('/post', tokensController.check_login_token, tokensController.renew_token, postsController.create_post);
  app.get('/post/:id', postsController.get_post);
  app.delete('/post/:id', tokensController.check_login_token, tokensController.renew_token, postsController.delete_post);
  app.get('/postbyuser/:id', postsController.get_post_by_userId);
  app.post('/postimage', tokensController.check_login_token, tokensController.renew_token, postsController.upload_image);
  app.get('/user/:id', usersController.get_user);
  app.post('/login', usersController.verify_oauth_token, usersController.login, tokensController.create_token);
  app.get('/searchPost/:term', postsController.search_post);
  app.get('/newestposts', postsController.get_newest_posts);
  app.post('/editProfile', tokensController.check_login_token, tokensController.renew_token, usersController.editProfile);
  app.post('/editPost', tokensController.check_login_token, tokensController.renew_token, postsController.edit_post);
}

module.exports = {
  init_router: init_router
}
