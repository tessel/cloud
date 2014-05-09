require('dotenv').load();

var net = require('net');

module.exports = {
  server: null,

  start: function() {
    this.server = net.createServer(this.onConnection);
    return this;
  },

  onConnection: function(conn) {
    console.log('server connected');

    conn.on('end', function() {
      console.log('server disconnected');
    });

    conn.on('data', function(data) {
      console.log(data.toString());
    });

    setInterval(function() {
      conn.write('heartbeat\n')
    }, 2000);
  },

  listen: function(port) {
    if (port == null) {
      port = process.env.TCP_PORT;
    }

    this.server.listen(port, function() {
      console.log("TCP server bound to port " + port);
    });
  }
};
