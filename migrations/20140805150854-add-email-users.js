module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('Users', 'email',
      { type: DataTypes.STRING, unique: true, allowNull: false }
    );
    done()
  },
  down: function(migration, DataTypes, done) {
    migration.removeColumn('Users', 'email');
    done()
  }
}
