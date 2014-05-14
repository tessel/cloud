require('dotenv').load();

var debug = require('debug')('tcp:' + process.pid);

var cluster = require('cluster'),
    net     = require('net'),
    fs      = require('fs');

var through = require('through');

var connections = {};

var onConnection = function onConnection(socket) {
  debug('client connected');

  var deviceId;

  socket.on('data', function(chunk) {
    var data = chunk.toString();

    if (/^id: (.*)$/.test(data)) {
      deviceId = data.match(/^id: (.*)$/)[1];
      connections[deviceId] = socket;
      process.send({command: 'add', data: deviceId})
    }

    debug('received: %s', data);
  });

  socket.on('end', function() {
    if (deviceId) {
      delete connections[deviceId];
      process.send({command: 'delete', data: deviceId})

      debug('client %s disconnected', deviceId);
    } else {
      debug('client disconnected')
    }
  });
};

var send = function send(device, data) {
  var connection = connections[device];

  if (!connection) { return false; }

  connection.write(data);
};

var sendFile = function sendFile(device, filename) {
  var connection = connections[device];

  if (!connection) {
    return false;
  }

  var stream = fs.createReadStream(filename),
      write = function(chunk) { connection.write(chunk); },
      end = function() {
        connection.write('file-end');
        debug('finished streaming file to %s', device);
      };

  debug('starting to stream file to %s', device);
  connection.write('file-start');

  stream.pipe(through(write, end, { autoDestroy: false }));
};

process.on('message', function(message) {
  if (!message.command || !message.device) {
    return;
  }

  switch (message.command) {
    case 'send':
      send(message.device, message.data)
      break;

    case 'sendFile':
      sendFile(message.device, message.data)
      break;

    default:
      return;
  }
})

module.exports.server = net.createServer(onConnection);
