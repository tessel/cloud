'use strict';

// first, load environment settings from .env file; if it exists
require('dotenv').load();

process.env.NODE_ENV || (process.env.NODE_ENV = "development")

var path = require('path');

var express = require('express'),
    logger = require('morgan'),
    bodyParser = require('body-parser');

var routes = {
  index: require('./routes/index'),
};

// connect to and synchronize database
var db = require('./models');

db.sequelize
  .sync()
  .complete(function(err) {
    if (!!err) {
      console.log(err);
      process.exit();
    }

    console.log('DB Synced Successfully')
  });

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// intercept and return error for all requests that don't contain an API key
app.use(function(req, res, next) {
  var authorized = false;

  var json = {
    code: 400,
    error: "invalid_request",
    error_description: "The API key was not found"
  };

  // check in Authorization header
  if (/Bearer \w+/.test(req.headers["Authorization"])) {
    authorized = true;
  }

  // check URL query string (only with GET requests)
  if (req.method === "GET") {
    if (req.query.api_key !== undefined && /\w+/.test(req.query.api_key)) {
      authorized = true;
    }
  }

  // check POST body
  if (req.method === "POST") {
    if (req.body.api_key !== undefined && /\w+/.test(req.body.api_key)) {
      authorized = true;
    }
  }

  if (authorized) {
    next();
  } else {
    res.status = 400;
    res.json(json);
  }
});

app.use('/', routes.index);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});


module.exports = app;
