'use strict';

module.exports = function Tessel(sequelize, DataTypes) {
  var Tessel = sequelize.define('Tessel', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, unique: true, primaryKey: true },
    device_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
    lastPush: DataTypes.DATE,
    lastPushChecksum: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Tessel.hasMany(models.User)
      }
    }
  });

  return Tessel;
};
