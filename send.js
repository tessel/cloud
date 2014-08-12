var cluster = require('cluster');

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

module.exports.isConnected = function isConnected(tesselId) {
  return !!findTesselNode(tesselId);
};

module.exports.send = function send(tesselId, data) {
  var node = findTesselNode(tesselId);
  if (!node) {
    return false;
  }

  var worker = cluster.workers[node];

  // We send data to the Node using `worker.send`, telling it that we want to
  // send arbitrary data to a tessel.
  worker.send({ command: 'send', device: tesselId, data: data });
};

module.exports.sendFile = function sendFile(tesselId, filename) {
  var node = findTesselNode(tesselId);
  if (!node) {
    return false;
  }

  var worker = cluster.workers[node];

  // We send data to the Node using `worker.send`, telling it that we want to
  // stream a file to a tessel.
  worker.send({ command: 'sendFile', device: tesselId, data: filename });
};
