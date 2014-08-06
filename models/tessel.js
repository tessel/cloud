'use strict';

module.exports = function Tessel(sequelize, DataTypes) {
  var Tessel = sequelize.define('Tessel', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, unique: true, primaryKey: true },
    device_id: { type: DataTypes.STRING, unique: true, allowNull: false },
    deviceName: DataTypes.STRING,
    owner: { type: DataTypes.INTEGER },
    connected: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    lastPush: DataTypes.DATE,
    lastPushChecksum: DataTypes.STRING,
    lastPushUser: DataTypes.INTEGER,
    lastPushScript: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Tessel.hasMany(models.User)
      }
    }
  });

  return Tessel;
};
