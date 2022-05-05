const postsController = require('./controllers/posts');
const usersController = require('./controllers/users');
const tokensController = require('./controllers/tokens');

function init_router(app) {
  app.post('/post', tokensController.check_login_token, postsController.create_post);
  app.get('/post', tokensController.check_login_token, postsController.get_post);
  app.post('/user', tokensController.check_login_token, usersController.create_user);
  app.get('/user', tokensController.check_login_token, usersController.get_user);
}

module.exports = {
  init_router: init_router
}
