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
  users: require('./routes/users'),
  v1: require('./routes/v1')
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

app.use('/',      routes.index);
app.use('/users', routes.users);
app.use('/v1',    routes.v1)

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
