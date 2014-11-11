'use strict';
/*
Controller for generating new API keys
*/
var db = require('../models'),
    User = db.User;

var ConfigurationController = {};

ConfigurationController.apiKey = function(req, res, next) {
  User
    .find({ where: { accessToken: req.query.accessToken } })
    .success(function(user) {
      var json = {
        ok: true,
        data: [],
        apiKey: user.apiKey
      };
      res.json(json);
    });
}

ConfigurationController.genApiKey = function(req, res, next) {
  User
    .find({ where: { accessToken: req.body.accessToken } })
    .success(function(user) {

      user.genApiKey();
      user
        .save()
        .success(function(user) {
          var json = {
            ok: true,
            data: []
          };

          res.json(json);
        });
    });
}

module.exports = ConfigurationController;
