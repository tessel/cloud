module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('Tessels', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        unique: true,
        primaryKey: true
      },

      device_id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false
      },

      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    done()
  },

  down: function(migration, DataTypes, done) {
    migration.dropTable('Tessels');
    done()
  }
}
