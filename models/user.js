'use strict';

module.exports = function User(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, unique: true, primaryKey: true },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    apiKey: { type: DataTypes.STRING, unique: true, allowNull: false },
    accessToken: { type: DataTypes.STRING, unique: true, allowNull: false },
    refreshToken: { type: DataTypes.STRING, unique: true, allowNull: false }
  }, {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Tessel)
      }
    },
    instanceMethods: {
      genApiKey: function(){
        var d = Date.now();
        var apikey = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

        apikey = apikey.replace(/[xy]/g, function(c) {
          var r = (d + Math.random() * 16) % 16 | 0;
          d = Math.floor(d / 16);
          return (c === 'x' ? r : (r&0x7|0x8)).toString(16);
        });

        this.apiKey = apikey;

        return this;
      }
    }
  });

  return User;
};
