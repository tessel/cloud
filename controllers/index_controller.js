var IndexController = {};

IndexController.index = function(req, res) {
  res.json({ greeting: "Hello from Express" });
};

module.exports = IndexController;
