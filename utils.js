const crypto = require('crypto');
const Log = require('./models/log');
const axios = require('axios');

function generate_token() {
  return crypto.randomBytes(32).toString('hex');
}

function check_body_fields(body, required_fields) {
  if (!body) {
    return false;
  }

  for (let field of required_fields) {
    if (!body[field]) {
      return false;
    }
  }

  return true;
}

function is_valid_keyword(keyword) {
  // No spaces, /, \ allowed in keywords. The length is at most 10
  return !(
    keyword.length > 10 ||
    keyword.indexOf(' ') !== -1 ||
    keyword.indexOf('/') !== -1 ||
    keyword.indexOf('\\') !== -1
  );
}

function response(req, res, code, content) {
  try {
    const log = new Log({
      IP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      reqURL: req.url,
      rBody: JSON.stringify(req.body),
      responseCode: code,
      responseContent: JSON.stringify(content),
      userAgent: req.get('user-agent'),
      timeStamp: new Date()
    });

    log.save();
  }
  catch(err) {}

  return res.status(code).json(content);
}

function http_get(url) {
  return axios.get(url);
}

module.exports = {
  generate_token,
  check_body_fields,
  is_valid_keyword,
  response,
  http_get
};
