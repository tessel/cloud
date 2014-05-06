var util = require('util');

var ApplicationController = require('./application_controller');

var db = require('../models'),
    User = db.User;

var UsersController = function UsersController () {};

util.inherits(UsersController, ApplicationController);

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

  del: {
    code: 500,
    error: 'server_error',
    error_description: 'Error deleting user.'
  },

  missingData: {
    code: 400,
    error: 'invalid_request',
    error_description: 'Request missing necessary data to create/update user.'
  }
};

UsersController.prototype.create = function(req, res) {
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
};

UsersController.prototype.update = function(req, res) {
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
};

UsersController.prototype.delete = function(req, res) {
  var id = req.params.id;

  User
    .find({ where: { authId: id } })

    .error(function(err) {
      res.status = 500;
      return res.json(errors.del);
    })

    .success(function(user) {
      if (!user) {
        res.status = 400;
        return res.json(errors.userDoesNotExist);
      }

      user
        .destroy()

        .error(function(err) {
          res.status = 500;
          return res.json(errors.del);
        })

        .success(function() {
          return res.json({
            code: 200,
            message: "User was deleted successfully"
          });
        })
    });
};

module.exports = new UsersController();
