require('dotenv').load();

var debug = require('debug')('tcp');

var cluster = require('cluster'),
    net     = require('net'),
    fs      = require('fs');

var connections = {};

var onConnection = function onConnection(socket) {
  debug('client connected');

  var deviceId;

  socket.on('data', function(chunk) {
    var data = chunk.toString();

    if (/^id: (.*)$/.test(data)) {
      deviceId = data.match(/^id: (.*)$/)[1];
      connections[deviceId] = conn;
    }

    debug('received: %s', data);
  });

  socket.on('end', function() {
    if (deviceId) {
      delete connections[deviceId];
      debug('client %s disconnected', deviceId);
    } else {
      debug('client disconnected')
    }
  });
};

module.exports.connections = connections;

module.exports.send = function send(device, data) {
  var connection = this.connections[device];

  if (!connection) {
    return false;
  }

  connection.write(data);
};

module.exports.sendFile = function sendFile(device, filename) {
  var connection = this.connections[device];

  if (!connection) {
    return false;
  }

  var stream = fs.createReadStream(filename),
      write = function(chunk) { connection.write(chunk); },
      end = function() { connection.write('file-end'); };

  stream.pipe(through(write, end, { autoDestroy: false }));
};
