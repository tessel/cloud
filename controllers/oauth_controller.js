/*
Route Oauth/login requests/callbacks
Can be obsolete if we switch to SSO like the forum
*/
var db = require('../models'),
    User = db.User;

var debug = require('debug')('api');

var errors = {
  authentication : {
    ok: false,
    error: {
      type: "server_error",
      message: "Error authorizing new user"
    }
  }
};

// TODO - save user data returned from /login to database

function OauthController(oauth) {
  this.oauth = oauth;
};

OauthController.prototype.authenticate = function(req, res, next) {
  next();
};

OauthController.prototype.login = function(req, res) {
  var login = this.oauth.login();
  return login(req, res);
}

OauthController.prototype.logout = function(req, res) {
  var logout = this.oauth.logout(function(req, res) {
    res.redirect('/');
  });
  return logout(req, res);
}

OauthController.prototype.profile = function(req, res) {
  var user = this.oauth.session(req);
  if (!user) {
    return res.redirect(301, "/login");
  }

  // Make an authenticated request to oauth server for our info.
  user.json('users/profile').get(function (err, json, last) {
    // json contains "username", "email", "name", and "apiKey"
    res.send('<h1>Hello ' + json.email + '!</h1>');
  });
}

OauthController.prototype.callback = function(req, res) {
  var user = this.oauth.session(req)

  if (user) {
    user.json('users/profile').get(function(err, json, last) {
      User
        .findOrCreate({ email: json.email }, {
          apiKey: User.genApiKey(),
          accessToken: req.session['tessel.io:oauthAccessToken'],
          refreshToken: req.session['tessel.io:oauthRefreshToken'],
          username: json.username
        })
        .error(function(err){
          debug(err);
          return res.json(500, errors.authentication);
        })
        .success(function(existingUser, created){
          if (!created) {
            existingUser.accessToken = req.session['tessel.io:oauthAccessToken'];
            existingUser.refreshToken = req.session['tessel.io:oauthRefreshToken'];
            existingUser.username = json.username;
            existingUser
              .save()
              .success(function(){
                res.redirect('/profile');
              });
          } else {
            res.redirect('/profile');
          }
        });
    });
  }
}

module.exports = OauthController;
