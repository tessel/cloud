'use strict';

var Sequelize = require('sequelize');

var db_name = process.env.DB_NAME,
    db_host = process.env.DB_HOST,
    db_username = process.env.DB_USERNAME,
    db_password = process.env.DB_PASSWORD;

var sequelize = new Sequelize(
    db_name,
    db_username,
    db_password,
    {
      dialect: "postgres",
      host: db_host,
      port: 5432
    }
);

var db = {
  Sequelize: Sequelize,
  sequelize: sequelize
};

db.User = db.sequelize.import("./models/user");

module.exports = db;
