module.exports = {
  up: function(migration, DataTypes, done) {
    migration.renameColumn('Users', 'api_key', 'apiKey')
      .complete(function() {
        migration.renameColumn('Users', 'auth_id', 'authId')
          .complete(done)
      });
  },

  down: function(migration, DataTypes, done) {
    migration.renameColumn('Users', 'apiKey', 'api_key')
      .complete(function() {
        migration.renameColumn('Users', 'authId', 'auth_id')
          .complete(done)
      });
  }
}
