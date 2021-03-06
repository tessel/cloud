'use strict';

// first, load environment settings from .env file; if it exists
require('dotenv').load();

process.env.NODE_ENV || (process.env.NODE_ENV = "development")

var path = require('path');

var express = require('express')
  , logger = require('morgan')
  , debug = require('debug')('api')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , multipart = require('connect-multiparty')
  , accepts = require('accepts')
  , session = require('express-session')
  , rem = require('rem')
  ;

var apiRouter = require('./routes/api_routes'),
    oauthRouter = require('./routes/oauth_routes');

// connect to and synchronize database
var db = require('./models');

db.sequelize
  .sync()
  .complete(function(err) {
    if (!!err) {
      debug(err);
      process.exit();
    }

    debug('db synced successfully')
  });

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(multipart());
app.use(session({
  secret: "what is the secret who has the secret"
}));

// Create our API client.
var tesselauth = rem.createClient({
  "id": "tessel.io",
  "base": process.env.OAUTH_SERVER,
  "auth": {
    "type": "oauth",
    "version": "2.0",
    "base": process.env.OAUTH_SERVER,
    "authorizePath": "/oauth/authorise",
    "tokenPath": "/oauth/token",
    "params": {
      "scope": [process.env.GRANT_TYPE],
      "response_type": "code"
    },
    "validate": "/profile",
    "oob": false,
    "oobVerifier": false,
  },
}, {
  key: process.env.CLIENT_ID,
  secret: process.env.CLIENT_SECRET,
});

app.use('/api*', function(req, res, next) {
  var accept = accepts(req);
  if (accept.types('application/vnd.tessel.remote.v1')) {
    next();
  } else {
    return res.json(400, {
      message: "Incorrect API version"
    });
  }
});


// Create the OAuth interface.
var oauth = rem.oauth(tesselauth, process.env.OAUTH_REDIRECT);
app.use('/', oauthRouter(oauth));

// Default routes.
app.use('/', apiRouter);

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
