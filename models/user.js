'use strict';

module.exports = function User(sequelize, DataTypes) {
  return sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, unique: true, primaryKey: true },
    authId: { type: DataTypes.INTEGER, unique: true, allowNull: false },
    apiKey: { type: DataTypes.STRING, unique: true, allowNull: false }
  });
};
