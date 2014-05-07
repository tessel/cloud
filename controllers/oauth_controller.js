var util = require('util');

var ApplicationController = require('./application_controller');

var db = require('../models'),
    User = db.User;

var OauthController = function UsersController () {};

util.inherits(OauthController, ApplicationController);
 
