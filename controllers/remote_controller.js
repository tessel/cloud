var fs = require('fs'),
    crc = require('crc');

var db = require("../models"),
    User = db.User,
    Tessel = db.Tessel;

var RemoteController = {}

var sender = require('../workers/send');

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

    var command = req.body.flash == 'true' ? 0x01 : 0x02;

    var users = tessel.users.filter(function(user) {
      return user.apiKey === req.apiKey;
    });

    if (users.length === 0) {
      return res.json(403, errors.notFound);
    }

    var file;
    file = req.files['script_tar'];

    if (!file) {
      return res.json(400, errors.noFile)
    }

    if (sender.isConnected(tessel.device_id)) {

      var crc32 = new crc.CRC32(),
          stream = fs.createReadStream(file.path);

      stream.on('data', function (data) {
        crc32.update(data, 'utf8');
      });

      stream.on('end', function () {

        var sum = crc32.checksum();
        tessel.lastPush = new Date();
        tessel.lastPushChecksum = crc32.hexdigest();
        tessel.lastPushUser = req.user.id;
        tessel.lastPushScript = file.name;
        tessel.save();

        fs.stat(file.path, function(err, stat){
          sender.sendFile(tessel.device_id, command, stat.size, sum, file.path);
        });


        return res.json({
          ok: true,
          data: "Your code is uploading to your Tessel now."
        });
      });

    } else {
      return res.json(404, errors.unreachable);
    }

  });
};

RemoteController.network = function(req, res) {
  var self = this;

  Tessel.find({
    include: [ User ],
    where: { device_id: req.params.device_id, }
  }).success(function(tessel) {
    if (!tessel) {
      return res.json(403, errors.notFound);
    }

    sender.send(tessel.device_id, 0x07);
    return res.json({
      ok: true,
      data: "Request sent"
    });
  });
};

RemoteController.log = function(req, res) {
  var self = this;

  Tessel.find({
    include: [ User ],
    where: { device_id: req.params.device_id, }
  }).success(function(tessel) {
    if (!tessel) {
      return res.json(403, errors.notFound);
    }

    sender.send(tessel.device_id, 0x08);
    return res.json({
      ok: true,
      data: "Request sent"
    });
  });
}

module.exports = RemoteController;
