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
      message: "The API key provided is not valid"
    }
  },
  keyNotFound: {
    ok: false,
    error: {
      type: "Not Found",
      message: "No API key was found in this request"
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
    return res.json(400, errors.keyNotFound);
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
        return res.json(400, errors.incorrectApiKey);
      }
    });
};

module.exports = ApplicationController;
