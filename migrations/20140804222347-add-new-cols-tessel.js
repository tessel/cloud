module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('Tessels', 'deviceName', DataTypes.STRING);
    migration.addColumn('Tessels', 'owner', { type: DataTypes.INTEGER });
    migration.addColumn('Tessels', 'connected', { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false });
    migration.addColumn('Tessels', 'lastPushUser', DataTypes.INTEGER);
    migration.addColumn('Tessels', 'lastPushScript', DataTypes.STRING);
    done()
  },
  down: function(migration, DataTypes, done) {
    migration.removeColumn('Tessels', 'deviceName');
    migration.removeColumn('Tessels', 'owner');
    migration.removeColumn('Tessels', 'connected');
    migration.removeColumn('Tessels', 'lastPushUser');
    migration.removeColumn('Tessels', 'lastPushScript');
    done()
  }
}
