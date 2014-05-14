var debug = require('debug')('tcp');

var cluster = require('cluster');
var cpus = require('os').cpus().length;

if (cluster.isMaster) {
  for (var i = 0; i < cpus; i++) { cluster.fork(); }

  cluster.on('exit', function(worker, code, signal) {
    debug('worker %s died', worker.process.pid);
  });
} else {
  // require('./tcp');
}
