module.exports = {
  up: function(migration, DataTypes, done) {
    migration.removeColumn('Users', 'authId', DataTypes.STRING);
    migration.addColumn('Users', 'username', DataTypes.STRING);
    migration.addColumn('Users', 'accessToken', DataTypes.STRING);
    migration.addColumn('Users', 'refreshToken', DataTypes.STRING);
    done();
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('Users', 'refreshToken');
    migration.removeColumn('Users', 'accessToken');
    migration.addColumn('Users', 'username');
    migration.addColumn('Users', 'authId');
    done();
  }
}
