'use strict';

module.exports = function User(sequelize, DataTypes) {
  var UserModel = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, unique: true, primaryKey: true },
    auth_id: { type: DataTypes.INTEGER, unique: true, validate: { notNull: true } },
    api_key: { type: DataTypes.STRING, unique: true, validate: { notNull: true } }
  });

  return UserModel;
};
