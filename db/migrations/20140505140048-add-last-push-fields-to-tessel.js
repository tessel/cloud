module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('Tessels', 'lastPush', DataTypes.DATE);
    migration.addColumn('Tessels', 'lastPushChecksum', DataTypes.STRING);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('Tessels', 'lastPush');
    migration.removeColumn('Tessels', 'lastPushChecksum');
    done()
  }
}
