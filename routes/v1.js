var router = require('express').Router();

var db = require("../models"),
    User = db.User
    Tessel = db.Tessel;

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
router.all("/*", function(req, res, next) {
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
});

// GET /v1/tessels
//
// Lists all tessels belonging to the currently authenticated user
router.get("/tessels", function(req, res) {
  User
    .find({ where: { apiKey: req.api_key }, include: [ Tessel ] })
    .success(function(user) {
      var json = [];

      user.tessels.forEach(function(tessel) {
        json.push({ id: tessel.device_id });
      });

      res.json(json);
    });
});

// GET /v1/tessels/:device_id
//
// Returns data on a specific tessel, if the user has access
router.get("/tessels/:device_id", function(req, res) {
  Tessel.find({
    include: [ User ],
    where: { device_id: req.params.device_id, }
  }).success(function(tessel) {
    var users = tessel.users.filter(function(user) {
      return user.apiKey === req.api_key;
    });

    if (users.length === 0) {
      res.status = 403;
      res.json({
        error: "Permission Denied",
        info: "I didn't recognize that core name or ID"
      });
    } else {
      res.json({ id: tessel.device_id });
    }
  });
});

module.exports = router;
