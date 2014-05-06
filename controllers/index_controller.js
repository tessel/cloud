var util = require('util');

var ApplicationController = require('./application_controller');

var IndexController = function IndexController () {};

util.inherits(IndexController, ApplicationController);

IndexController.prototype.index = function(req, res) {
  res.json({ greeting: "Hello from Express" });
};

module.exports = new IndexController();
