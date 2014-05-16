var db = require('../models'),
    Tessel = db.Tessel;
    User = db.User;

var TesselsController = {};

var errors = {
  tesselDoesNotExist: {
    code: 400,
    error: 'invalid_request',
    error_description: 'Tessel does not exist.'
  },

  tesselExists: {
    code: 400,
    error: 'invalid_request',
    error_description: 'Tessel already exists'
  },

  create: {
    code: 500,
    error: 'server_error',
    error_description: 'Error creating new Tessel.'
  },

  update: {
    code: 500,
    error: 'server_error',
    error_description: 'Error updating Tessel details.'
  },

  del: {
    code: 500,
    error: 'server_error',
    error_description: 'Error deleting Tessel.'
  },

  missingParams: {
    code: 400,
    error: 'invalid_request',
    error_description: 'Request missing necessary params to create/update Tessel.'
  },
};

TesselsController.create = function(req, res) {
  var params = req.body;


  if (!params.api_key || !params.device_id) {
    res.status = 400;
    return res.json(errors.missingParams);
  }

  // Check if the tessel already exists
  Tessel
    .find({ where: { device_id: params.device_id } })

    .error(function(err) {
      console.log(err);
      res.status = 500;
      return res.json(errors.create);
    })

    .success(function(tessel) {
      // since we are not allowing multiple users per tessel at the momment,
      // if it does exist respond with an error.
      if (!!tessel) {
        res.status = 400;
        return res.json(errors.tesselExists);
      }

      // Look up the user to associate the api_key
      User
        .find({ where: { apiKey: params.api_key } })

        .success(function(user) {
          // If the user is found create a new tessel instance and save it
          if (!!user) {
            var tessel = Tessel.build({ device_id: params.device_id });

            tessel
              .save()

              .error(function(err) {
                console.log(err);
                return res.json(500, errors.create);
              })

              .success(function(tessel) {
                // If the tessel is created successfully we associate it with
                // the user doing the request
                tessel
                  .addUser(user)
                  .success(function() {
                    // Everything goo return success message
                    return res.json({
                      code: 200,
                      message: "Tessel was created successfully"
                    });
                  })
              });
          }else{
            // User not found send back an error.
            return res.json(500, errors.create);
          }
        })

        .error(function(err) {
          console.log(err);
          return res.json(500, errors.create);
        });
    });
};

TesselsController.update = function(req, res) {
  var params = req.body;

  params.id = req.params.id;

  if (!params.api_key || !params.id) {
    res.status = 400;
    return res.json(errors.missingParams);
  }

  // lookup user, it will always exist because it just passed
  // authentication
  User
    .find({ where: { apiKey: params.api_key }})

    .error(function(err) {
      res.status = 500;
      return res.json(errors.update);
    })

    .success(function(user) {
      // Check if tessel exists using id
      Tessel
        .find({ where: { id: params.id } })
        .success(function(tessel) {
          // if it does not exist respond with error
          if (!tessel) {
            return res.json(400, errors.tesselDoesNotExist);
          }
          // if it does exist check if it is related to current user
          user
            .hasTessel(tessel)
            .success(function(result) {
              // if it belongs to current user update the record
              // and respond with success
              if (result) {
                tessel
                  .update(params.tessel)
                  .success(function() {
                    return res.json({
                      code: 200,
                      message: "Tessel was updated successfully"
                    });
                  });
              }else{
                // if it does not belong to this user respond with error
                return res.json(400, errors.tesselDoesNotExist);
              }
            })
        })
    });
};

TesselsController.delete = function(req, res) {
  var params = req.body;

  params.id = req.params.id;

  if (!params.api_key || !params.id) {
    res.status = 400;
    return res.json(errors.missingParams);
  }

  // lookup user, it will always exist because it just passed
  // authentication
  User
    .find({ where: { apiKey: params.api_key }})

    .error(function(err) {
      res.status = 500;
      return res.json(errors.update);
    })

    .success(function(user) {
      // Check if tessel exists using id
      Tessel
        .find({ where: { id: params.id } })
        .success(function(tessel) {
          // if it does not exist respond with error
          if (!tessel) {
            return res.json(400, errors.tesselDoesNotExist);
          }
          // if it does exist check if it is related to current user
          user
            .hasTessel(tessel)
            .success(function(result) {
              // if it belongs to current user delete both association
              // and record, and respond with success
              if (result) {
                user
                  .removeTessel(tessel)
                  .success(function() {
                    tessel
                      .destroy()
                      .success(function() {
                        return res.json({
                          code: 200,
                          message: "Tessel was deleted successfully"
                        });
                      });
                  });
              }else{
                // if it does not belong to this user respond with error
                return res.json(400, errors.tesselDoesNotExist);
              }
            })
        })
    });
};

module.exports = TesselsController;
