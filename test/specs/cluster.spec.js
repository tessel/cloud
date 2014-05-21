'use strict';

var cluster = require('cluster');

var module = source('cluster');

describe('Cluster', function() {
  var connections, workers;

  beforeEach(function() {
    connections = {
      '1': [],
      '2': ['TM-00-01', 'TM-00-02'],
      '3': ['TM-00-03']
    };

    workers = {
      '1': { send: spy() },
      '2': { send: spy() },
      '3': { send: spy() }
    };

    cluster.connections = connections;
    cluster.workers = workers;
  });

  describe('#isConnected', function() {
    context('if the tessel is connected to any of the nodes', function() {
      it('returns true', function() {
        expect(module.isConnected('TM-00-01')).to.be.true;
      });
    });

    context("if the tessel isn't connected", function() {
      it('returns false', function() {
        expect(module.isConnected('TM-00-04')).to.be.false;
      });
    });
  });

  describe('#send', function() {
    it('sends arbitrary data to the appropriate worker', function() {
      var packet = { command: 'send', device: 'TM-00-03', data: 'hello-world' };
      module.send('TM-00-03', 'hello-world');
      expect(workers['3'].send).to.be.calledWith(packet);
    });

    context("if the tessel isn't connected", function() {
      it("returns false", function() {
        var result = module.send('TM-00-04', 'hello-world');
        expect(result).to.be.false;
      });

      it("doesn't send a message to the worker", function() {
        module.send('TM-00-04', 'hello-world');

        for (var w in workers) {
          var worker = workers[w];
          expect(worker.send).to.not.be.called;
        }
      });
    });
  });

  describe('#sendFile', function() {
    it('sends the filename to the appropriate worker', function() {
      var packet = { command: 'sendFile', device: 'TM-00-03', data: '/tmp/file' };
      module.sendFile('TM-00-03', '/tmp/file');
      expect(workers['3'].send).to.be.calledWith(packet);
    });

    context("if the tessel isn't connected", function() {
      it("returns false", function() {
        var result = module.sendFile('TM-00-04', '/tmp/file');
        expect(result).to.be.false;
      });

      it("doesn't send a message to the worker", function() {
        module.sendFile('TM-00-04', '/tmp/file');

        for (var w in workers) {
          var worker = workers[w];
          expect(worker.send).to.not.be.called;
        }
      });
    });
  });
});
