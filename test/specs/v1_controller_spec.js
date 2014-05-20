'use strict';

var v1 = source('controllers/v1_controller');

var MockRequest = require('../support/mock_request'),
    MockResponse = require('../support/mock_response');

var db = source('models'),
    User = db.User,
    Tessel = db.Tessel;

var fs = require('fs'),
    crypto = require('crypto');

var EventEmitter = require('events').EventEmitter;

var cluster = source('cluster');

var formidable = require('formidable');

describe('V1Controller', function() {
  var req, res, user;

  beforeEach(function() {
    req = new MockRequest({
      apiKey: 'apikey'
    });

    res = new MockResponse();

    user = {
      tessels: [
        {
          device_id: "TM-00-02",
          lastPush: null,
          lastPushChecksum: null
        }
      ]
    };
  });

  describe('#list', function() {
    var promise;

    beforeEach(function() {
      promise = {
        success: stub().yields(user)
      };

      stub(User, 'find').returns(promise);
    });

    afterEach(function() {
      User.find.restore();
    });

    it('fetches tessels that belong to the User', function() {
      var find = { where: { apiKey: 'apikey' }, include: [ Tessel ]};

      v1.list(req, res);

      expect(User.find).to.be.calledWith(find);
      expect(promise.success).to.be.called;
    })

    it('returns a JSON array containing all Tessels belonging to the user', function() {
      var response = {
        ok: true,
        data: [
          {
            id: "TM-00-02",
            lastPush: null,
            lastPushChecksum: null
          }
        ]
      };

      v1.list(req, res);

      expect(res.json).to.be.calledWith(response);
    });
  });

  describe('#details', function() {
    var promise, tessel;

    beforeEach(function() {
      req.params = { device_id: 'TM-00-02' };

      tessel = {
        device_id: 'TM-00-02',
        lastPush: null,
        lastPushChecksum: null,
        users: [ { apiKey: 'apikey' }]
      };

      promise = { success: stub().yields(tessel) };


      stub(Tessel, 'find').returns(promise);
    });

    afterEach(function() {
      Tessel.find.restore();
    });

    it("finds all Tessels with the provided device_id", function() {
      v1.details(req, res);

      expect(Tessel.find).to.be.calledWith({
        include: [ User ],
        where: { device_id: 'TM-00-02' }
      });
    });

    describe('if the Tessel is not registered to the User', function() {
      beforeEach(function() {
        tessel.users = [];
      });

      it('returns a not found error', function() {
        v1.details(req, res);
        expect(res.json).to.be.calledWith(403, v1.errors.notFound);
      });
    });

    describe('if the Tessel is registered to the User', function() {
      it("returns the tessel's details", function() {
        v1.details(req, res);
        expect(res.json).to.be.calledWith({
          ok: true,
          data: {
            id: 'TM-00-02',
            lastPush: null,
            lastPushChecksum: null
          }
        });
      });
    })
  });

  describe('#push', function() {
    var promise, tessel, form, stream;

    beforeEach(function() {
      req.params = { device_id: 'TM-00-02' };

      form = { parse: stub() };

      tessel = {
        device_id: 'TM-00-02',
        lastPush: null,
        lastPushChecksum: null,
        users: [ { apiKey: 'apikey' }],
        save: spy()
      };

      promise = { success: stub().yields(tessel) };

      stream = new EventEmitter;

      stub(Tessel, 'find').returns(promise);
      stub(formidable, 'IncomingForm').returns(form);

      stub(cluster, 'isConnected');
      stub(cluster, 'sendFile');

      stub(fs, 'createReadStream').returns(stream)
    });

    afterEach(function() {
      Tessel.find.restore();
      formidable.IncomingForm.restore();

      cluster.isConnected.restore();
      cluster.sendFile.restore();

      fs.createReadStream.restore();
    });

    it('tries to finds the tessel with the provided device_id', function() {
      v1.push(req, res);
      expect(Tessel.find).to.be.calledWith({
        include: [ User ],
        where: { device_id: 'TM-00-02' }
      });
    });

    context("if it doesn't find the requested tessel", function() {
      it('returns a notFound error', function() {
        promise.success.yields(null);
        v1.push(req, res);
        expect(res.json).to.be.calledWith(403, v1.errors.notFound)
      });
    });


    context("if the Tessel isn't registered to the User", function() {
      it('returns a notFound error', function() {
        tessel.users = [];
        v1.push(req, res);
        expect(res.json).to.be.calledWith(403, v1.errors.notFound)
      });
    });

    it('uses Formidable to parse the form data', function() {
      form.parse.callsArgWith(1, null, {}, {});
      v1.push(req, res);
      expect(formidable.IncomingForm).to.be.calledWithNew;
    });

    context('if no file is provided', function() {
      it("returns an error", function() {
        form.parse.callsArgWith(1, null, {}, {});
        v1.push(req, res);
        expect(res.json).to.be.calledWith(400, v1.errors.noFile);
      })
    });

    context('if a file is uploaded', function() {
      var file;

      beforeEach(function() {
        file = { path: '/tmp/file' };
        form.parse.callsArgWith(1, null, {}, { file: file });
      });

      context("if the Tessel is connected", function() {
        beforeEach(function() {
          cluster.isConnected.returns(true);
        });

        it('tells the Cluster to push the file', function() {
          v1.push(req, res);
          expect(cluster.sendFile).to.be.calledWith('TM-00-02', '/tmp/file');
        });

        it('updates the Tessel with the uploaded file checksum and timestamp', function() {
          v1.push(req, res);

          stream.emit('end');

          expect(tessel.lastPush).to.be.a('date');
          expect(tessel.lastPushChecksum).to.be.a('string');
          expect(tessel.save).to.be.called;
        });

        it('returns a message indicating code is uploading to the tessel', function() {
          v1.push(req, res);

          stream.emit('end');

          expect(res.json).to.be.calledWith({
            ok: true,
            data: "Your code is uploading to your Tessel now."
          });
        });
      });

      context('if the tessel is not connected', function() {
        beforeEach(function() {
          cluster.isConnected.returns(false);
        });

        it("returns an error indicating the tessel isn't reachable", function() {
          v1.push(req, res);
          expect(cluster.isConnected).to.be.calledWith('TM-00-02');
          expect(res.json).to.be.calledWith(404, v1.errors.unreachable);
        })
      });
    });
  });
});
