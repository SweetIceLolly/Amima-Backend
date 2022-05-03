function create_user(req, res, next) {
  res.send('create_user');
}

function get_user(req, res, next) {
  res.send('get_user');
}

module.exports = {
  create_user: create_user,
  get_user: get_user
};
