var router = require('express').Router();

var db = require('../models'),
    User = db.User;

router.post('/', function(req, res) {
  var data = req.body;

  if (!data.id || !data.apiKey) {
    res.status = 400;
    return res.json({
      code: 400,
      error: 'invalid_request',
      error_description: 'Request missing necessary data to create user.'
    });
  }

  User
    .find({ where: { authId: data.id } })

    .error(function(err) {
      // handle error in finding user
    })

    .success(function(user) {
      if (!!user) {
        res.status = 400;
        return res.json({
          code: 400,
          error: 'invalid_request',
          error_description: 'User already exists'
        });
      }

      User
        .create({ authId: data.id, apiKey: data.apiKey })

        .error(function(err) {
          res.status = 500;
          return res.json({
            code: 500,
            error: 'server_error',
            error_description: 'Error creating new User'
          });
        })

        .success(function(user) {
          return res.json({
            code: 200,
            message: "User was created successfully"
          });
        });
    });
});

module.exports = router;
