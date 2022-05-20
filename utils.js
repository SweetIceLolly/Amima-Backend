const crypto = require('crypto');
const req = require('express/lib/request');
const logSchema = require('./models/log');


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
  // There can only be letters and numbers in the keywords, and the length is at most 20.
  return /^[a-zA-Z0-9]{1,20}$/.test(keyword);
}

function response(req, res, code, content) {
  const log = new logSchema({
    IP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    reqURL: req.url,
    rBody: req.body,
    responseCode: code,
    responseContent: content,
    userAgent: req.get('user-agent'),
    timeStamp: new Date()
  });

  try {
    log.save();
  }
  catch(err) {}

  return res.status(code).json(content);
}

module.exports = {
  generate_token,
  check_body_fields,
  is_valid_keyword,
  response
};
