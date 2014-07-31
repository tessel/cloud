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
  unimplemented: {
    ok: false,
    error: {
      type: "Not Found",
      message: "This API endpoint is currently unimplemented"
    }
  }
};

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
              .create({ device_id: deviceID })

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
            return res.json(500, errors.create);
          }
        });
    });
};

// Returns data on a specific tessel, if the user has access
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

TesselsController.update = function(req, res) {
  return res.json(404, error.unimplemented);
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
            })
        })
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
