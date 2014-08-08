var db = require('../models'),
    Tessel = db.Tessel,
    User = db.User;

var async = require('async');

var TesselsController = {};

var debug = require('debug')('api');

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

function getTesselInfo(tessel, apiKey) {
  var json = {
    hasTessel: false,
    data: {
      id: tessel.device_id,
      deviceName: tessel.deviceName,
      owner: null,
      collaborators: [],
      connected: tessel.connected,
      lastUser: null,
      lastPushScript: tessel.lastPushScript,
      lastPush: tessel.lastPush,
      lastPushChecksum: tessel.lastPushChecksum,
    }
  };
  tessel.users.forEach(function(user, index, users) {
    if (user.apiKey === apiKey) {
      json.hasTessel = true;
    }
    if (user.id == tessel.owner) {
      json.data.owner = user.email;
    }
    if (user.id == tessel.lastPushUser) {
      json.data.lastUser = user.email;
    }
    json.data.collaborators.push(user.email);
  });

  return json;
}

TesselsController.create = function(req, res) {
  var deviceID = req.body.device_id,
      self = this;

  if (!req.apiKey || !deviceID) {
    return res.json(400, errors.missingParams);
  }

  // Check if the tessel already exists
  Tessel
    .find({ where: { device_id: deviceID } })

    .error(function(err) {
      debug(err);
      return res.json(500, errors.create);
    })

    .success(function(tessel) {

      if (!!req.user) {
        if (!!tessel) {
          if (tessel.values.owner) {
            return res.json(400, errors.tesselExists);
          } else {
            tessel.owner = req.user.id;
            tessel
              .save()
              .success(function() {
                return res.json({
                  ok: true,
                  data: "Tessel was created successfully"
                })
              });
          }

        } else {
          var tessel = Tessel

          Tessel
            .create({ device_id: deviceID, connected: false, owner: req.user.id })

            .error(function(err) {
              debug(err);
              return res.json(500, errors.create);
            })

            .success(function(tessel) {
              tessel
                .addUser(req.user)
                .success(function() {
                  return res.json({
                    ok: true,
                    data: "Tessel was created successfully"
                  });
                })
            });
        }
      } else {
        return res.json(500, errors.create);
      }
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
      var info = getTesselInfo(tessel, req.apiKey);

      if (info.hasTessel) {
        return res.json({
          ok: true,
          data: info.data
        });
      } else {
        return res.json(400, errors.tesselDoesNotExist);
      }
    });
};

// Updates the details of a specific Tessel
TesselsController.update = function(req, res) {
  var self = this;

  if (!req.apiKey || !req.params.device_id || (!req.body.deviceName && req.body.addUsers)) {
    return res.json(400, errors.missingParams);
  }

  Tessel
    .find({ where: {device_id: req.params.device_id } })

    .success(function(tessel) {
      if (!tessel) {
        return res.json(400, errors.tesselDoesNotExist);
      }

      req.user
        .hasTessel(tessel)
        .success(function(result) {
          if (result) {
            if (tessel.owner == req.user.id) {
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
}

TesselsController.delete = function(req, res) {
  var self = this;

  if (!req.apiKey || !req.params.device_id) {
    return res.json(400, errors.missingParams);
  }

  Tessel
    .find({ where: { device_id: req.params.device_id } })
    .success(function(tessel) {
      if (!tessel) {
        return res.json(400, errors.tesselDoesNotExist);
      }
      if (req.user.values.id == tessel.values.owner) {

      }
      req.user
        .hasTessel(tessel)
        .success(function(result) {
          if (result) {
            if (req.user.values.id == tessel.values.owner) {
              req.user
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
              return res.json(400, errors.notOwner);
            }
          } else {
            return res.json(400, errors.tesselDoesNotExist);
          }
        });
    });
};

// Lists all tessels belonging to the currently authenticated user
TesselsController.list = function(req, res) {
  req.user
    .getTessels()
    .success(function(tessels){
      var json = {
        ok: true,
        data: []
      };
      async.each(tessels, function(tessel, callback){
        tessel.getUsers().success(function(users){
          tessel.users = users;
          var info = getTesselInfo(tessel, req.apiKey);
          json.data.push(info.data);
          callback();
        });
      },function(err){
        return res.json(json);
      }
    );
  });
};

module.exports = TesselsController;
