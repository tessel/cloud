'use strict';

var Sequelize = require('sequelize');

var config = require('./config/db')[process.env.NODE_ENV];

var sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      dialect: "postgres",
      host: config.host,
      port: 5432
    }
);

var db = {
  Sequelize: Sequelize,
  sequelize: sequelize
};

db.User = db.sequelize.import("./models/user");
db.Tessel = db.sequelize.import("./models/tessel");

db.User.hasMany(db.Tessel)
db.Tessel.hasMany(db.User)

module.exports = db;
