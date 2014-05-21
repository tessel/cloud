var db = require('../models'),
    Tessel = db.Tessel;
    User = db.User;

var TesselsController = {};

var debug = require('debug')('tcp');

TesselsController.errors = {
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
};

TesselsController.create = function(req, res) {
  var deviceID = req.body.device_id,
      self = this;

  if (!req.apiKey || !deviceID) {
    return res.json(400, self.errors.missingParams);
  }

  // Check if the tessel already exists
  Tessel
    .find({ where: { device_id: deviceID } })

    .error(function(err) {
      debug(err);
      return res.json(500, self.errors.create);
    })

    .success(function(tessel) {
      if (!!tessel) {
        return res.json(400, self.errors.tesselExists);
      }

      User
        .find({ where: { apiKey: req.apiKey } })

        .error(function(err) {
          debug(err);
          return res.json(500, self.errors.create);
        })

        .success(function(user) {
          if (!!user) {
            var tessel = Tessel

            Tessel
              .create({ device_id: deviceID })

              .error(function(err) {
                debug(err);
                return res.json(500, self.errors.create);
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
            return res.json(500, self.errors.create);
          }
        });
    });
};

TesselsController.delete = function(req, res) {
  var params = req.body;

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

module.exports = TesselsController;
