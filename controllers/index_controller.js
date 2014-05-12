var IndexController = module.exports = {};

IndexController.index = function(req, res) {
  res.json({ greeting: "Hello from Express" });
};
