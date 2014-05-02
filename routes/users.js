var router = require('express').Router();

var db = require('../models'),
    User = db.User;

var errors = {
  userDoesNotExist: {
    code: 400,
    error: 'invalid_request',
    error_description: 'User does not exist.'
  },

  userExists: {
    code: 400,
    error: 'invalid_request',
    error_description: 'User already exists'
  },

  create: {
    code: 500,
    error: 'server_error',
    error_description: 'Error creating new User.'
  },

  update: {
    code: 500,
    error: 'server_error',
    error_description: 'Error updating user details.'
  },

  missingData: {
    code: 400,
    error: 'invalid_request',
    error_description: 'Request missing necessary data to create/update user.'
  }
};

router.post('/', function(req, res) {
  var data = req.body;

  if (!data.id || !data.apiKey) {
    res.status = 400;
    return res.json(errors.missingData);
  }

  User
    .find({ where: { authId: data.id } })

    .error(function(err) {
      res.status = 500;
      return res.json(errors.create);
    })

    .success(function(user) {
      if (!!user) {
        res.status = 400;
        return res.json(errors.userExists);
      }

      User
        .create({ authId: data.id, apiKey: data.apiKey })

        .error(function(err) {
          res.status = 500;
          return res.json(errors.create);
        })

        .success(function(user) {
          return res.json({
            code: 200,
            message: "User was created successfully"
          });
        });
    });
});

router.put('/:id', function(req, res) {
  var data = req.body,
      id = req.params.id;

  if (!data.apiKey) {
    res.status = 400;
    return res.json(errors.missingData);
  }

  User
    .find({ where: { authId: id }})

    .error(function(err) {
      res.status = 500;
      return res.json(errors.update);
    })

    .success(function(user) {
      if (!user) {
        res.status = 400;
        return res.json(errors.userDoesNotExist);
      }

      user.apiKey = data.apiKey;
      user
        .save()
        .error(function(err) {
          res.status = 500;
          return res.json(errors.update);
        })

        .success(function() {
          return res.json({
            code: 200,
            message: "User was updated successfully"
          });
        });
    });
});

module.exports = router;
