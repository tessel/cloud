var fs = require('fs'),
    crypto = require('crypto'),
    util = require('util');

var ApplicationController = require('./application_controller');

var db = require("../models"),
    User = db.User
    Tessel = db.Tessel;

var formidable = require('formidable');

var V1Controller = function V1Controller () {}

var tcp = require('../tcp');

util.inherits(V1Controller, ApplicationController);

// extracts an API key (if present) from a request
var getAPIKey = function(req) {
  var headerRegex = /^Bearer (\w+)/;

  // check in Authorization header
  if (headerRegex.test(req.headers.authorization)) {
    return req.headers.authorization.match(headerRegex)[1];
  }

  // check URL query string (only with GET requests)
  if (req.method === "GET") {
    if (req.query.api_key !== undefined && /\w+/.test(req.query.api_key)) {
      return req.query.api_key;
    }
  }

  // check POST body
  if (req.method === "POST") {
    if (req.body.api_key !== undefined && /\w+/.test(req.body.api_key)) {
      return req.body.api_key;
    }
  }

  return false;
};

// intercept and return error for all requests that don't contain an API key
V1Controller.prototype.auth = function(req, res, next) {
  var json = {
    code: 400,
    error: "invalid_request",
    error_description: "The API key was not found"
  };

  var key = getAPIKey(req);

  if (key) {
    req.api_key = key;
    next();
  } else {
    res.status = 400;
    res.json(json);
  }
};

// Lists all tessels belonging to the currently authenticated user
V1Controller.prototype.list = function(req, res) {
  User
    .find({ where: { apiKey: req.api_key }, include: [ Tessel ] })
    .success(function(user) {
      var json = [];

      user.tessels.forEach(function(tessel) {
        json.push({
          id: tessel.device_id,
          lastPush: tessel.lastPush,
          lastPushChecksum: tessel.lastPushChecksum
        });
      });

      res.json(json);
    });
};

// Returns data on a specific tessel, if the user has access
V1Controller.prototype.details = function(req, res) {
  Tessel.find({
    include: [ User ],
    where: { device_id: req.params.device_id, }
  }).success(function(tessel) {
    var users = tessel.users.filter(function(user) {
      return user.apiKey === req.api_key;
    });

    if (users.length === 0) {
      res.status = 403;
      return res.json({
        error: "Permission Denied",
        info: "I didn't recognize that core name or ID"
      });
    }

    res.json({
      id: tessel.device_id,
      lastPush: tessel.lastPush,
      lastPushChecksum: tessel.lastPushChecksum
    });
  });
};

// Pushes source to the Tessel
V1Controller.prototype.push = function(req, res) {
  Tessel.find({
    include: [ User ],
    where: { device_id: req.params.device_id, }
  }).success(function(tessel) {
    var users = tessel.users.filter(function(user) {
      return user.apiKey === req.api_key;
    });

    console.log(tessel.users[0].apiKey, req.api_key)

    if (users.length === 0) {
      res.status = 403;
      return res.json({
        error: "Permission Denied",
        info: "I didn't recognize that core name or ID"
      });
    }

    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
      var file;

      for (file in files) break;
      file = files[file];

      if (tcp.connected(tessel.device_id)) {
        tcp.send(tessel.device_id, fs.readFileSync(file.path));

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
            message: "Your code is uploading to your Tessel now."
          })
        });
      } else {
        res.json({
          message: "Your tessel is not reachable at this time."
        });
      }
    });
  });
};

module.exports = new V1Controller();
