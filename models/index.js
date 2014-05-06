'use strict';

var fs = require('fs'),
    path = require('path');

var Sequelize = require('sequelize');

var config = require('../config/db')[process.env.NODE_ENV]

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
}

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js')
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  });

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

module.exports = db;
