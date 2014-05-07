module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('TesselsUsers', {
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      TesselId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    });

    done()
  },

  down: function(migration, DataTypes, done) {
    migration.dropTable('TesselsUsers')
    done()
  }
}
