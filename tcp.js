require('dotenv').load();

var net = require('net');

module.exports = {
  server: null,

  connections: {},

  start: function() {
    this.server = net.createServer(this.onConnection);
    return this;
  },

  onConnection: function(conn) {
    console.log('client connected');

    var deviceId;

    conn.on('data', function(data) {
      var str = data.toString();

      if (/^id: (.*)$/.test(str)) {
        deviceId = str.match(/^id: (.*)$/)[1];
        module.exports.connections[deviceId] = conn;
      }

      console.log('received: ' + str);
    });

    conn.on('end', function() {
      delete module.exports.connections[deviceId];
      console.log('client ' + deviceId +' disconnected');
    });
  },

  send: function(conn, data) {
    var connection = this.connections[conn];
    if (!connection) { return false; }
    connection.write(data);
  },

  connected: function(id) {
    return !!this.connections[id];
  }
};