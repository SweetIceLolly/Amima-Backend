const postsController = require('./controllers/posts');
const usersController = require('./controllers/users');
const tokensController = require('./controllers/tokens');

function init_router(app) {
  app.post('/post', tokensController.check_login_token, tokensController.renew_token, postsController.create_post);
  app.get('/post/:id', tokensController.check_login_token, tokensController.renew_token, postsController.get_post);
  app.post('/postimage', postsController.upload_image);
  app.post('/user', usersController.create_user, tokensController.create_token);
  app.get('/user/:id', tokensController.check_login_token, tokensController.renew_token, usersController.get_user);
  app.post('/login', usersController.login, tokensController.create_token);
  app.get('/searchPost/:term', postsController.search_post);
  app.get('/newestposts', postsController.get_newest_posts);
}

module.exports = {
  init_router: init_router
}
