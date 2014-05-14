// This Cluster file provides a mechanism for the API to talk to the TCP servers
// spun up in seperate processes.
var cluster = require('cluster');

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

module.exports.isConnected = function isConnected(tesselId) {
  return !!findTesselNode(tesselId);
};

module.exports.send = function send(tesselId, data) {
  var node = findTesselNode(tesselId);
  if (!node) {
    return false;
  }

  var worker = cluster.workers[node];

  worker.send({ command: 'send', device: tesselId, data: filename });
};

module.exports.sendFile = function sendFile(tesselId, filename) {
  var node = findTesselNode(tesselId);
  if (!node) {
    return false;
  }

  var worker = cluster.workers[node];

  worker.send({ command: 'sendFile', device: tesselId, data: filename });
};
