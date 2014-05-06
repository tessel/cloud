module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('Users', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        unique: true,
        primaryKey: true
      },

      auth_id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false
      },

      api_key: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },

      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    done()
  },

  down: function(migration, DataTypes, done) {
    migration.dropTable('Users');
    done()
  }
}
