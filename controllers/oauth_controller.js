'use strict';

var errors = {
  unimplemented : {
    ok: false,
    error: {
      type: "Not Found",
      message: "This route is currently unimplemented"
    }
  }
};

// TODO - implement placeholder methods, refactor Oauth routes out of app.js

var OauthController = function(oauth) {
  this.ouath = oauth;
};

OauthController.prototype.authenticate = function(req, res, next) {
  next();
};

OauthController.prototype.login = function(req, res) {
  return this.oauth.login();
}

OauthController.prototype.logout = function(req, res) {
  return this.oauth.logout(function(req, res) {
    res.redirect('/profile');
  });
}

OauthController.prototype.session = function(req, res) {
  return res.json(400, errors.unimplemented);
}

module.exports = OauthController;
