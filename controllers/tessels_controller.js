var db = require('../models'),
    Tessel = db.Tessel;
    User = db.User;

var TesselsController = {};

var debug = require('debug')('tcp');

var errors = {
  tesselDoesNotExist: {
    ok: false,
    error: {
      type: 'invalid_request',
      message: 'Tessel does not exist.'
    }
  },

  tesselExists: {
    ok: false,
    error: {
      type: 'invalid_request',
      message: 'Tessel already exists'
    }
  },

  create: {
    ok: false,
    error: {
      type: 'server_error',
      message: 'Error creating new Tessel.'
    }
  },

  del: {
    ok: false,
    error: {
      type: 'server_error',
      message: 'Error deleting Tessel.'
    }
  },

  missingParams: {
    ok: false,
    error: {
      type: 'invalid_request',
      message: 'Request missing necessary params to create Tessel.'
    }
  },

  notOwner : {
    ok: false,
    error: {
      type: 'invalid_request',
      message: 'Only the Tessel owner can make changes to the Tessel.'
    }
  },

  unimplemented: {
    ok: false,
    error: {
      type: 'Not Found',
      message: 'This API endpoint is currently unimplemented.'
    }
  }
};

function prepareNewUsers(userString) {
  var users = userString.split(',');

  return users;
}

function createNewUsersFromEmail(tessel, newEmails) {
  for (var i=0; i<newEmails.length; i++) {
    User
      .create({ email: newEmails[i], apiKey: User.genApiKey() })
      .success(function(user){
        tessel
          .addUser(user)
          .success(function(){});
      });
  }
}

TesselsController.create = function(req, res) {
  var deviceID = req.body.device_id,
      self = this;

  if (!req.apiKey || !deviceID) {
    return res.json(400, errors.missingParams);
  }

  // Check if the tessel already exists
  // TODO - possible security issue telling
  Tessel
    .find({ where: { device_id: deviceID } })

    .error(function(err) {
      debug(err);
      return res.json(500, errors.create);
    })

    .success(function(tessel) {
      if (!!tessel) {
        return res.json(400, errors.tesselExists);
      }

      User
        .find({ where: { apiKey: req.apiKey } })

        .error(function(err) {
          debug(err);
          return res.json(500, errors.create);
        })

        .success(function(user) {
          if (!!user) {
            var tessel = Tessel

            Tessel
              .create({ device_id: deviceID, connected: false, owner: user.id })

              .error(function(err) {
                debug(err);
                return res.json(500, errors.create);
              })

              .success(function(tessel) {
                tessel
                  .addUser(user)
                  .success(function() {
                    return res.json({
                      ok: true,
                      data: "Tessel was created successfully"
                    });
                  })
              });
          } else {
            console.log(user);
            return res.json(500, errors.create);
          }
        });
    });
};

// Returns data on a specific Tessel, if the user has access
TesselsController.details = function(req, res) {
  var self = this;

  Tessel
    .find({
      include: [ User ],
      where: { device_id: req.params.device_id, }
    })
    .success(function(tessel) {
      var users = tessel.users.filter(function(user) {
        return user.apiKey === req.apiKey;
      });

      if (users.length === 0) {
        return res.json(403, errors.notFound);
      }

      res.json({
        ok: true,
        data: {
          id: tessel.device_id,
          lastPush: tessel.lastPush,
          lastPushChecksum: tessel.lastPushChecksum
        }
      });
    });
};

// Updates the details of a specific Tessel
TesselsController.update = function(req, res) {
  var self = this;

  console.log("received device name", req.body.deviceName);
  console.log('received new user emails', req.body.addUsers);
  if (!req.apiKey || !req.params.device_id || (!req.body.deviceName && req.body.addUsers)) {
    return res.json(400, errors.missingParams);
  }

  User
    .find({ where: {apiKey: req.apiKey }})

    .error(function(err) {
      return res.json(500, errors.update);
    })

    .success(function(user) {
      Tessel
        .find({ where: {device_id: req.params.device_id } })

        .success(function(tessel) {
          if (!tessel) {
            return res.json(400, errors.tesselDoesNotExist);
          }

          user
            .hasTessel(tessel)

            .success(function(result) {
              if (result) {
                if (tessel.owner == user.id) {
                  if (req.body.addUsers) {
                    var addUsers = prepareNewUsers(req.body.addUsers);
                    if (addUsers) {
                      User.findAll( {
                        where: { email: addUsers}
                      })
                        .success(function(users){
                          var foundEmails = [];
                          for (var i=0; i<users.length; i++) {
                            foundEmails.push(users[i].values.email);
                            users[i]
                              .hasTessel(tessel)
                              .success(function(result){
                                if (!result){
                                  tessel
                                    .addUser(users[i])
                                    .success(function () {});
                                }
                              });

                            if (i==users.length-1) {
                              var newUsers = addUsers.filter(function(value) {
                                return foundEmails.indexOf(value) < 0;
                              });
                              createNewUsersFromEmail(tessel, newUsers);
                            }

                          }

                          if (users.length < 1) {
                            createNewUsersFromEmail(tessel, addUsers);
                          }

                        });
                    }
                  }
                  var newName = req.body.deviceName;
                  if (newName) {
                    tessel.deviceName = newName;
                    tessel
                      .save()
                      .success(function() {
                        return res.json({
                          ok: true,
                          data: "The Tessel has been updated"
                        });
                      });
                  } else {
                    return res.json({
                      ok: true,
                      data: "The Tessel will be updated"
                    });
                  }
                } else {
                  return res.json(400, errors.notOwner);
                }
              } else {
                return res.json(400, errors.tesselDoesNotExist);
              }
            });
        });
    });
}

TesselsController.delete = function(req, res) {
  var self = this;

  if (!req.apiKey || !req.params.id) {
    return res.json(400, errors.missingParams);
  }

  User
    .find({ where: { apiKey: req.apiKey }})

    .error(function(err) {
      return res.json(500, errors.del);
    })

    .success(function(user) {
      Tessel
        .find({ where: { id: req.params.id } })
        .success(function(tessel) {
          if (!tessel) {
            return res.json(400, errors.tesselDoesNotExist);
          }

          user
            .hasTessel(tessel)
            .success(function(result) {
              if (result) {
                user
                  .removeTessel(tessel)
                  .success(function() {
                    tessel
                      .destroy()
                      .success(function() {
                        return res.json({
                          ok: true,
                          data: "Tessel was deleted successfully"
                        });
                      });
                  });
              } else {
                return res.json(400, errors.tesselDoesNotExist);
              }
            });
        });
    });
};

// Lists all tessels belonging to the currently authenticated user
TesselsController.list = function(req, res) {
  User
    .find({ where: { apiKey: req.apiKey }, include: [ Tessel ] })
    .success(function(user) {
      var json = {
        ok: true,
        data: []
      };

      user.tessels.forEach(function(tessel) {
        json.data.push({
          id: tessel.device_id,
          lastPush: tessel.lastPush,
          lastPushChecksum: tessel.lastPushChecksum
        });
      });

      res.json(json);
    });
};

module.exports = TesselsController;
