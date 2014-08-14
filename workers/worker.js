require('dotenv').load();

var debug = require('debug')('tcp:' + process.pid);

var net     = require('net'),
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

      // we use Node's built-in IPC to send data back to the cluster master
      process.send({command: 'add', data: deviceId})
    } else if (/^network: (.*)$/.test(data)) {
      // NRY - needs a strategy for operating on the Tessel side
    } else if (/^log: (.*)$/.test(data)) {
      // NRY - needs a strategy for operating on the Tessel side
    }

    debug('received: %s', data);
  });

  socket.on('end', function() {
    if (deviceId) {
      delete connections[deviceId];

      // let the cluster master know that the tessel has been disconnected
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

var sendFile = function sendFile(device, header, filename) {

  console.log('Write file with header', new Buffer(header));
  var connection = connections[device];

  if (!connection) {
    return false;
  }

  var stream = fs.createReadStream(filename),
      write = function(chunk) { connection.write(chunk); },
      end = function() {
        debug('finished streaming file to %s', device);
      };

  debug('starting to stream file to %s', device);
  connection.write(new Buffer(header));

  // Using the `through` module, we stream the file from disk to the tessel over
  // the TCP socket
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
      sendFile(message.device, message.data, message.file)
      break;

    default:
      return;
  }
})

module.exports.server = net.createServer(onConnection);
