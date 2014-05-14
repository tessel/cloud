// This Cluster file provides a mechanism for the API to talk to the TCP servers
// spun up in seperate processes.
var cluster = require('cluster');

module.exports.isConnected = function isConnected(tesselId) {
  return !!cluster.connections[tesselId];
};

module.exports.send = function send(tesselId, data) {
  if (!this.isConnected(tesselId)) {
    return false;
  }

  var worker = cluster.connections[tesselId];

  worker.send({ command: 'send', device: tesselId, data: filename });
};

module.exports.sendFile = function sendFile(tesselId, filename) {
  if (!this.isConnected(tesselId)) {
    return false;
  }

  var worker = cluster.connections[tesselId];

  worker.send({ command: 'sendFile', device: tesselId, data: filename });
};
