var cluster = require('cluster'),
    db = require("../models"),
    Tessel = db.Tessel;

// This file allows for communication between the API server and the TCP server
// cluster.
//
// The Master can communicate with each Node by using the `worker.send` method.
//
// Additionally, the TCP server and Cluster are already set up to synchronize
// their knowledge of what Tessels are connected. In the Cluster, this is stored
// in the `connections` var as an object mapping Node IDs to an array of
// connected Tessel IDs
//
// e.g.
//
// {
//   '1': [],
//   '2': [],
//   '3': [],
//   '4': ['TM-00-02-f0009a30-00724f4d-68b16208'],
// }

var findTesselNode = function findTesselNode(tesselId) {
  var node, IDs;

  for (node in cluster.connections) {
    IDs = cluster.connections[node];

    for (var i = 0; i < IDs.length; i++) {
      var id = IDs[i];
      if (id === tesselId) {
        return node;
      }
    }
  }

  return false;
};

module.exports.handleWorkerMessage = function handleWorkerMessage(worker) {
  return function handleWorkerMessage(data) {
    if (!data.command) {
      return;
    }

    // incoming command sent from worker.js where socket is listening
    switch (data.command) {
      case 'add':
        cluster.connections[worker.id].push(data.data);
        Tessel
          .findOrCreate({ device_id: data.data }, {
            connected: true
          })
          .success(function(tessel, created){
            if (!created) {
              tessel.connected = true;
              tessel.save();
            }
          });
        break;

      case 'delete':
        var connections = cluster.connections[worker.id];
        for (var i = 0; i < connections.length; i++) {
          if (connections[i] === data.data) { connections.splice(i, 1); }
        }
        Tessel
          .find({where: {device_id: data.data}})
          .success(function(tessel){
            if (tessel){
              tessel.connected = false;
              tessel.save();
            }
          });
        break;

      case 'network':
        break;

      case 'log':
        break;

      default:
        return;
    }
  }
}

module.exports.isConnected = function isConnected(tesselId) {
  return !!findTesselNode(tesselId);
};

module.exports.send = function send(tesselId, command) {
  var node = findTesselNode(tesselId);
  if (!node) {
    return false;
  }

  var worker = cluster.workers[node];

  // command packet without file
  var data = new Buffer(5);
  data.writeUInt8(command, 0);
  data.writeUInt32LE(0x00, 1);

  // We send data to the Node using `worker.send`, telling it that we want to
  // send data to a tessel.
  worker.send({ command: 'send', device: tesselId, data: data });
};

module.exports.sendFile = function sendFile(tesselId, command, fileSize, crc, filename) {
  var node = findTesselNode(tesselId);
  if (!node) {
    return false;
  }

  // command packet with file
  var worker = cluster.workers[node];
  var data = new Buffer(9);
  data.writeUInt8(command, 0);
  data.writeUInt32LE(fileSize & 0xFFFFFFFF, 1);
  data.writeUInt32LE(crc, 5);

  // We send data to the Node using `worker.send`, telling it that we want to
  // stream a file to a tessel.
  worker.send({ command: 'sendFile', device: tesselId, data: data, file: filename });
};
