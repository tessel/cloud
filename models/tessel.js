'use strict';

module.exports = function Tessel(sequelize, DataTypes) {
  return sequelize.define('Tessel', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, unique: true, primaryKey: true },
    device_id: { type: DataTypes.INTEGER, unique: true, validate: { notNull: true } },
  });
};
