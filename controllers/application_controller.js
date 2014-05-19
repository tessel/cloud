'use strict';

var OAuth2 = require('oauth').OAuth2,
    restler = require('restler'),
    oauthConfig = require('../config/oauth');

var db = require('../models'),
    User = db.User;

var errors = {
  incorrectApiKey: {
    ok: false,
    error: {
      type: "invalid_request",
      message: "The API key was not found"
    }
  }
};

var getApiKey = function(req) {
  var headerRegex = /^Bearer (\w+)/;

  if (headerRegex.test(req.headers.authorization)) {
    return req.headers.authorization.match(headerRegex)[1];
  }

  if (req.method === "GET") {
    if (req.query.api_key !== undefined && /\w+/.test(req.query.api_key)) {
      return req.query.api_key;
    }
  }

  if (['POST', 'DELETE', 'PUT'].indexOf(req.method) > -1) {
    if (req.body.api_key !== undefined && /\w+/.test(req.body.api_key)) {
      return req.body.api_key;
    }
  }

  return false;
};

var ApplicationController = {};

ApplicationController.authenticate = function(req, res, next) {
  var clientId = process.env.CLIENT_ID,
      clientSecret = process.env.CLIENT_SECRET,
      grantType = process.env.GRANT_TYPE,
      clientBasicAuth = new Buffer(clientId + ':' + clientSecret).toString('base64');

  var oauth2 = new OAuth2(
    clientId,
    clientSecret,
    oauthConfig.server,
    oauthConfig.authorisePath,
    oauthConfig.tokenPath,
    { 'Authorization': 'Basic ' + clientBasicAuth }
  );

  var profilePath = oauthConfig.server + oauthConfig.profilePath;

  req.apiKey = getApiKey(req);

  if (!req.apiKey) {
    return res.json(400, errors.incorrectApiKey);
  }

  User
    .find({ where: { apiKey: req.apiKey } })

    .error(function(err) {
      next(error);
    })

    .success(function(user) {
      if (user) {
        restler
          .get(profilePath, { query: { access_token: user.accessToken } })
          .on('complete', function(data, response) {
            if (data.apiKey === req.apiKey) {
              next();
            } else {
              return res.json(400, errors.incorrectApiKey);
            }
          });
      } else {
        // We use grant type `client_credentials` to avoid asking the user
        // for username and password on signup and when re-generating the
        // apiKey. We pass the api_key param to the OAuth2 server,
        // the server will handle it and look up an user with it.
        var oauthOptions = {
              'grant_type': grantType,
              'api_key': req.body.api_key || req.query.api_key,
              'client_id': clientId
            };

        var clientGrantCB = function (err, accessToken, refreshToken, results) {
          if (err) {
            return next(err);
          }

          restler
            .get(profilePath, { query: { access_token: accessToken } })
            .on('complete', function(data, response) {
              if (data.apiKey === req.apiKey) {
                // when we have the user data from OAuth we use that to update
                // an existing User, or create a new one.

                User
                  .findOrCreate({ username: data.username }, {
                    apiKey: data.apiKey,
                    accessToken: accessToken,
                    refreshToken: refreshToken
                  })

                  .error(function(err) {
                    next(err);
                  })

                  .success(function(user, created) {
                    // if the model wasn't created, we need to update the
                    // appropriate fields
                    if (!created) {
                      user.accessToken = accessToken;
                      user.refreshToken = refreshToken;
                      user.apiKey = data.apiKey;

                      user
                        .save()

                        .error(function(err) {
                          next(err);
                        })

                        .success(function() {
                          next();
                        });
                    }
                  });
              } else {
                return res.json(400, errors.incorrectApiKey);
              }
            });
        };

        oauth2.getOAuthAccessToken(null, oauthOptions, clientGrantCB);
      }
    });
};

module.exports = ApplicationController;
