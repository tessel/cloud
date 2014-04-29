var router = require('express').Router();

// intercept and return error for all requests that don't contain an API key
router.get("/*", function(req, res, next) {
  var authorized = false;

  var json = {
    code: 400,
    error: "invalid_request",
    error_description: "The API key was not found"
  };

  // check in Authorization header
  if (/Bearer \w+/.test(req.headers.authorization)) {
    authorized = true;
  }

  // check URL query string (only with GET requests)
  if (req.method === "GET") {
    if (req.query.api_key !== undefined && /\w+/.test(req.query.api_key)) {
      authorized = true;
    }
  }

  // check POST body
  if (req.method === "POST") {
    if (req.body.api_key !== undefined && /\w+/.test(req.body.api_key)) {
      authorized = true;
    }
  }

  if (authorized) {
    next();
  } else {
    res.status = 400;
    res.json(json);
  }
});

router.get("/", function(req, res) {
  res.json({ greeting: "Hello World" });
});

module.exports = router;
