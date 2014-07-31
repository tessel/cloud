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

var routes = require('./routes');

// connect to and synchronize database
var db = require('./models');

db.sequelize
  .sync()
  .complete(function(err) {
    if (!!err) {
      console.log(err);
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
  "base": "https://auth.tessel.io",
  "auth": {
    "type": "oauth",
    "version": "2.0",
    "base": "https://auth.tessel.io",
    "authorizePath": "/oauth/authorise",
    "tokenPath": "/oauth/token",
    "params": {
      "scope": ["https://tessel-grant"],
      "response_type": "code"
    },
    "validate": "/profile",
    "oob": false,
    "oobVerifier": false,
  },
}, {
  key: process.env.OAUTH_KEY,
  secret: process.env.OAUTH_SECRET,
});

// Create the OAuth interface.
var oauth = rem.oauth(tesselauth, process.env.OAUTH_REDIRECT);

// oauth.middleware intercepts the callback url that we set when we
// created the oauth middleware.
app.use(oauth.middleware(function (req, res, next) {
  console.log("User is now authenticated.");
  res.redirect('/profile');
}));

// oauth.login() is a route to redirect to the OAuth login endpoint.
// Use oauth.login({ scope: ... }) to set your oauth scope(s).
app.get('/login', oauth.login());

// Logout URL clears the user's session.
app.get('/logout', oauth.logout(function (req, res) {
  res.redirect('/profile');
}));

app.get('/profile', function (req, res) {
  var user = oauth.session(req);
  if (!user) {
    return res.redirect(301, "/login");
  }

  // Make an authenticated request to oauth server for our info.
  user.json('users/profile').get(function (err, json, last) {
    // json contains "username", "email", "name", and "apiKey"
    res.send('<h1>Hello ' + json.email + '!</h1>');
  });
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

// Default routes.
app.use('/', routes(oauth));

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
