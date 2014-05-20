'use strict';

var controller = source('controllers/tessels_controller');

var db = source('models'),
    User = db.User,
    Tessel = db.Tessel;

var MockRequest = require('../support/mock_request'),
    MockResponse = require('../support/mock_response');

describe("TesselsController", function() {
  var req, res;

  beforeEach(function() {
    req = new MockRequest({ apiKey: 'apikey', body: { device_id: 'TM-00-03' } });
    res = new MockResponse();
  });

  afterEach(function() {
  });

  describe("#create", function() {
    var promise;

    beforeEach(function() {
      promise = {
        success: stub().returns(promise),
        error: stub().returns(promise)
      };

      stub(Tessel, 'find').returns(promise);
    });

    afterEach(function() {
      Tessel.find.restore();
    });

    context("if no device_id or api_key is passed", function() {
      it('returns a missing params error', function() {
        delete req.body.device_id;
        controller.create(req, res);
        expect(res.json).to.be.calledWith(400, controller.errors.missingParams);
      });
    });

    context('if an error occurs while searching for existing tessels', function() {
      it('returns a create error', function() {
        promise.error.yields();
        controller.create(req, res);
        expect(res.json).to.be.calledWith(500, controller.errors.create);
      });
    });

    context('if the tessel is already registered', function() {
      it('returns a error indicating the tessel already exists', function() {
      });
    });
  });

  describe("#update", function() {
  });

  describe("#delete", function() {
  });
});
