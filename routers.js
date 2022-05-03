const utils = require('./utils');
const postsController = require('./controllers/posts');
const usersController = require('./controllers/users');

function init_router(app) {
  app.post('/post', utils.check_login_token, postsController.create_post);
  app.get('/post', utils.check_login_token, postsController.get_post);
  app.post('/user', utils.check_login_token, usersController.create_user);
  app.get('/user', utils.check_login_token, usersController.get_user);
}

module.exports = {
  init_router: init_router
}
