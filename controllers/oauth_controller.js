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

OauthController.prototype.session = function(req, res) {
  return res.json(400, errors.unimplemented);
}

module.exports = OauthController;
