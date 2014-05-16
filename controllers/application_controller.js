'use strict';

var OAuth2 = require('oauth').OAuth2,
    restler = require('restler'),
    oauthConfig = require('../config/oauth.json');

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

// extracts an API key (if present) from a request
var getApiKey = function(req) {
  var headerRegex = /^Bearer (\w+)/;

  // check in Authorization header
  if (headerRegex.test(req.headers.authorization)) {
    return req.headers.authorization.match(headerRegex)[1];
  }

  // check URL query string (only with GET requests)
  if (req.method === "GET") {
    if (req.query.api_key !== undefined && /\w+/.test(req.query.api_key)) {
      return req.query.api_key;
    }
  }

  // check POST body
  if (['POST', 'DELETE', 'PUT'].indexOf(req.method) > -1) {
    if (req.body.api_key !== undefined && /\w+/.test(req.body.api_key)) {
      return req.body.api_key;
    }
  }

  return false;
};

var ApplicationController = {};

ApplicationController.authenticate = function(req, res, next) {

  // OAuth2 authentication process
  // First we setup the OAuth2 client.
  // We use the CLIENT_ID and CLIENT_SECRET
  // defined in .env file.
  // The rest of the OAuth2 config details can
  // be found in ./config/oauth.json (server, paths to
  // different resrouces etc.
  var clientId = process.env.CLIENT_ID,
      clientSecret = process.env.CLIENT_SECRET,
      grantType = process.env.GRANT_TYPE,
      clientBasicAuth = new Buffer(clientId + ':' + clientSecret ).toString('base64');

  var oauth2 = new OAuth2(
    clientId,
    clientSecret,
    oauthConfig.server,
    oauthConfig.authorisePath,
    oauthConfig.tokenPath,
    { 'Authorization': 'Basic ' + clientBasicAuth }
  );

  var paramApiKey = getApiKey(req),
      profilePath = oauthConfig.server + oauthConfig.profilePath;

  if (paramApiKey) {
    req.apiKey = paramApiKey;
  } else {
    return res.json(400, errors.incorrectApiKey);
  }

  // Lookup user by api_key provided
  User
    .find({ where: { apiKey: paramApiKey } })
    // If success and user found use the stored oauth2 accessToken
    // to retrieve the current user profile.
    .success(function(user) {
      if (user) {
        restler
          .get(profilePath, { query: { access_token: user.accessToken } })
          .on('complete', function(data, response) {
            // On complete we compare the provided API_KEY to the one retrieved
            // from the Oauth provider, if they match we allow the request to
            // continue, if they do not match it is probable the apiKey was
            // re-generated in OAuth and the user is trying to use and old one,
            // we throw error and request the correct apiKey to be used.
            if (data.apiKey == paramApiKey) {
              next();
            }else{
              return res.json(400, errors.incorrectApiKey);
            }
          });
      }else{
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
          if (err) return next(err);

          // If the OAuth authentication and authorization was a success, we
          // do a request for the user Profile to validate the api_key.
          restler
            .get(profilePath, { query: { access_token: accessToken } })
            .on('complete', function(data, response) {
              if (data.apiKey == paramApiKey) {
                // On complete we used the username retrieved from the
                // profile in the OAuth server to look up the user in
                // the tessel-cloud DB.
                User
                  .find({ where: { username: data.username } })
                  .success(function(userB) {
                    // If the user record is found we update its values
                    // with the ones we got back from the OAuth server.
                    if (userB) {
                      userB.accessToken = accessToken;
                      userB.refreshToken = refreshToken;
                      userB.apiKey = data.apiKey;

                      userB
                        .save()
                        .success(function() {
                          // if success we continue with the request flow
                          next();
                        })
                        .error(function(err) {
                          next(err);
                        });
                    }else{
                      // If the user is not found it means this is a new user,
                      // so we create a new record based on the profile info
                      // we got back.
                      User
                        .create({
                          username: data.username,
                          apiKey: data.apiKey,
                          accessToken: accessToken,
                          refreshToken: refreshToken
                        })
                        .success(function(userC) {
                          // if success we continue with the request flow
                          next();
                        })
                        .error(function(err) {
                          next(err);
                        });
                    }
                  })
                  .error(function(err) {
                    next(err);
                  });
              }else{
                return res.json(400, errors.incorrectApiKey);
              }
            });
        };

        oauth2.getOAuthAccessToken(null, oauthOptions, clientGrantCB);
      }
    })
    .error(function(err) {
      next(error);
    });
};

module.exports = ApplicationController;
