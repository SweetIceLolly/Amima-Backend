const postsController = require('./controllers/posts');
const usersController = require('./controllers/users');
const tokensController = require('./controllers/tokens');

function init_router(app) {
  app.post('/post', tokensController.check_login_token, tokensController.renew_token, postsController.create_post);
  app.get('/post', tokensController.check_login_token, tokensController.renew_token, postsController.get_post);
  app.post('/user', usersController.create_user, tokensController.create_token);
  app.get('/user', tokensController.check_login_token, tokensController.renew_token, usersController.get_user);
  app.post('/login', usersController.login, tokensController.create_token);
}

module.exports = {
  init_router: init_router
}
