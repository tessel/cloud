module.exports = {
  up: function(migration, DataTypes, done) {
    migration.changeColumn('Users', 'username',
      { type: DataTypes.STRING, unique: true, allowNull: true }
    );
    migration.changeColumn('Users', 'accessToken',
      { type: DataTypes.STRING, unique: true, allowNull: true }
    );
    migration.changeColumn('Users', 'refreshToken',
      { type: DataTypes.STRING, unique: true, allowNull: true }
    );
    migration.addColumn('Users', 'accessTokenExpires',
      { type: DataTypes.DATE }
    );
    done()
  },
  down: function(migration, DataTypes, done) {
    migration.changeColumn('Users', 'username',
      { allowNull: false }
    );
    migration.changeColumn('Users', 'accessToken',
      { allowNull: false }
    );
    migration.changeColumn('Users', 'refreshToken',
      { allowNull: false }
    );
    migration.removeColumn('Users', 'accessTokenExpires');
    done()
  }
}
