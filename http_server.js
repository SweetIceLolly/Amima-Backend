const express = require('express');
const cors = require('cors');
const compression = require("compression");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const utils = require("./utils")
const uploader = require("express-fileupload");

const routers = require("./routers");

// Allowed API caller origins
const cors_domains = new Set([
  'http://localhost:4200',
  'https://amimaa.com'
]);

function start_server() {
  const app = express();

  app.disable('x-powered-by');

  // Add CORS middleware
  app.use(cors({
    origin: [
      'http://localhost:4200',
      'https://amimaa.com'
    ]
  }));

  // Add security middleware
  app.use(helmet());

  // Add compression middleware
  app.use(compression());

  // Add uploader middleware
  app.use(uploader({
    limits: { fileSize: Number(process.env.UPLOAD_IMAGE_SIZE) },
  }));


  // Add body parser middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Add cookie parser middleware
  app.use(cookieParser());

  // Add routes
  routers.init_router(app);

  // Add 404 handler
  app.use(function(req, res, next) {
    return utils.response(req, res, 404, 'Not found');
  });

  // Start server
  return new Promise((resolve, reject) => {
    app.listen(process.env.PORT || 3000, () => {
      resolve();
    }).on('error', (err) => {
      reject(err);
    });
  })
}

module.exports = {
  start_server: start_server
};
