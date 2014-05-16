var fs = require('fs'),
    crypto = require('crypto');

var db = require("../models"),
    User = db.User
    Tessel = db.Tessel;

var formidable = require('formidable');

var V1Controller = {}

var cluster = require('../cluster');

// Lists all tessels belonging to the currently authenticated user
V1Controller.list = function(req, res) {
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

// Returns data on a specific tessel, if the user has access
V1Controller.details = function(req, res) {
  Tessel.find({
    include: [ User ],
    where: { device_id: req.params.device_id, }
  }).success(function(tessel) {
    var users = tessel.users.filter(function(user) {
      return user.apiKey === req.apiKey;
    });

    if (users.length === 0) {
      return res.json(403, {
        ok: false,
        error: {
          type: "Permission Denied",
          message: "I didn't recognize that core name or ID"
        }
      });
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

// Pushes source to the Tessel
V1Controller.push = function(req, res) {
  Tessel.find({
    include: [ User ],
    where: { device_id: req.params.device_id, }
  }).success(function(tessel) {
    var users = tessel.users.filter(function(user) {
      return user.apiKey === req.apiKey;
    });

    console.log(tessel.users[0].apiKey, req.apiKey);

    if (users.length === 0) {
      return res.json(403, {
        ok: false,
        error:  {
          type: "Permission Denied",
          info: "I didn't recognize that core name or ID"
        }
      });
    }

    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
      var file;

      for (file in files) break;
      file = files[file];

      if (cluster.isConnected(tessel.device_id)) {
        cluster.sendFile(tessel.device_id, file.path);

        var hash = crypto.createHash('md5'),
            stream = fs.createReadStream(file.path);

        stream.on('data', function (data) {
          hash.update(data, 'utf8');
        });

        stream.on('end', function () {
          tessel.lastPush = new Date();
          tessel.lastPushChecksum = hash.digest('hex');

          tessel.save();

          res.json({
            ok: true,
            data: "Your code is uploading to your Tessel now."
          })
        });
      } else {
        return res.json(404, {
          ok: false,
          error: {
            type: "Not Found",
            message: "Your Tessel is not reachable at this time."
          }
        });
      }
    });
  });
};

module.exports = V1Controller;
