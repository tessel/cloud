var fs = require('fs'),
    crypto = require('crypto');

var db = require("../models"),
    User = db.User,
    Tessel = db.Tessel;

var RemoteController = {}

var cluster = require('../cluster');

var errors = {
  notFound: {
    ok: false,
    error: {
      type: "Not Found",
      message: "Device ID was not recognized."
    }
  },
  noFile: {
    ok: false,
    error: {
      type: 'No File Pushed',
      message: 'A file was not pushed as part of the request'
    }
  },
  unreachable: {
    ok: false,
    error: {
      type: "Not Found",
      message: "Your Tessel is not reachable at this time."
    }
  },
  unimplemented: {
    ok: false,
    error: {
      type: "Not Found",
      message: "This API endpoint is currently unimplemented"
    }
  }
}

// Pushes source to the Tessel
RemoteController.code = function(req, res) {
  var self = this;

  Tessel.find({
    include: [ User ],
    where: { device_id: req.params.device_id, }
  }).success(function(tessel) {
    if (!tessel) {
      return res.json(403, errors.notFound);
    }

    var flash = req.body.flash == 'true' ? true : false;

    var users = tessel.users.filter(function(user) {
      return user.apiKey === req.apiKey;
    });

    if (users.length === 0) {
      return res.json(403, errors.notFound);
    }

    var file;
    file = req.files['script_tar'];

    if (!file) {
      res.json(400, errors.noFile)
    }

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
        tessel.lastPushUser = req.user.id;
        tessel.lastPushScript = file.name;
        tessel.save();

        res.json({
          ok: true,
          data: "Your code is uploading to your Tessel now."
        })
      });
    } else {
      return res.json(404, errors.unreachable);
    }

  });
};

RemoteController.network = function(req, res) {
  return res.json(404, errors.unimplemented);
};

RemoteController.log = function(req, res) {
  return res.json(404, errors.unimplemented);
}

module.exports = RemoteController;
