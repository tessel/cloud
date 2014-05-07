'use strict';

var OAuth2 = require('oauth').OAuth2,
    restler = require('restler'),
    oauthConfig = require('../config/oauth.json');

var db = require('../models'),
    User = db.User;

var errors = {
  missingCreds: {
    code: 400,
    error: 'invalid_request',
    error_description: 'Request missing necessary data to create/update user.' +
    'If first time using tessel-cloud, make sure to include api_key, username and password ' +
    'you used to create your tessel accound.'
  }
};

var ApplicationController = function ApplicationController() {};

ApplicationController.prototype.oauthAuthentication = function(req, res, next) {

  var oauth2 = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    oauthConfig.server,
    oauthConfig.authorisePath,
    oauthConfig.tokenPath,
    null
  );

  User
    .find({ where: { apiKey: req.body.api_key } })
    .success(function(user) {
      if (user){
        var code = user.refreshToken,
            oauthOptions = { 'grant_type':'refresh_token' };

        var refreshTokenCB = function (err, accessToken, refreshToken, results) {
          if (err){
            return next(err);
          }

          user.accessToken = accessToken;
          user.refreshToken = refreshToken;

          restler
            .get('http://127.0.0.1:3000/users/profile', { access_token: user.accessToken })
            .on('complete', function(data, response){
              // TODO: compare api_key received from Oauth provider with param api key before updating
              // the user, do not update the user if keys do not match and send back error.
              user
                .save()
                .success(function(){
                  // TODO: continue with request flow if api_keys are a match
                  next();
                })
                .error(function(err){
                  return next(err);
                });
            });
        };

        oauth2.getOAuthAccessToken(code, oauthOptions, refreshTokenCB);
      }else{
        if (!req.body.username || !req.body.password) return res.json(400, errors.missingCreds);

        var code = req.body.password,
            oauthOptions = {
              'grant_type': 'password',
              'username': req.body.username
            };

        var pwdGrantCB = function (err, accessToken, refreshToken, results) {
          if (err){
            return next(err);
          }

          var profilePath = oauthConfig.server + oauthConfig.profilePath;

          restler
            .get(profilePath, { query: { access_token: accessToken }})
            .on('complete', function(data, response){
              // TODO: compare api_key received from Oauth provider with param api key before creating
              // the user, do not update the user if keys do not match and send back error.
              User
                .create({
                  username: data.username,
                  apiKey: data.apiKey,
                  accessToken: accessToken,
                  refreshToken: refreshToken
                })
                .success(function(user){
                  // TODO: Continue request flow if user was created successfully
                  next();
                })
                .error(function(err){
                  return next(err);
                });
              next();
            });
        };

        oauth2.getOAuthAccessToken(code, oauthOptions, pwdGrantCB);
      }
    })
    .error(function(err){
      next(error);
    });
}

module.exports = ApplicationController;
