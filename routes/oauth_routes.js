'use strict';

var router = require('express').Router();

var Oauth = require('../controllers/oauth_controller');

module.exports = function(oauth){
  var OController = new Oauth(oauth);

  router.use(oauth.middleware(OController.callback.bind(OController)));

  // OAuthentication routes
  router.get('/login', OController.login.bind(OController));
  router.get('/logout', OController.logout.bind(OController));
  router.get('/profile', OController.profile.bind(OController));

  // API key settings routes
  router.all('/api/user*', OController.authenticate);

  return router;
}
