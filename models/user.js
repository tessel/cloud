'use strict';

module.exports = function User(sequelize, DataTypes) {
  return sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, unique: true, primaryKey: true },
    auth_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
    api_key: { type: DataTypes.STRING, unique: true, allowNull: false }
  });
};
