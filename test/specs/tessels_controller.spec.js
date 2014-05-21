'use strict';

var controller = source('controllers/tessels_controller');

var db = source('models'),
    User = db.User,
    Tessel = db.Tessel;

var MockRequest = require('../support/mock_request'),
    MockResponse = require('../support/mock_response');

var MockPromise = function MockPromise() {
  this.error = stub().returns(this);
  this.success = stub().returns(this);
}

describe("TesselsController", function() {
  var req, res;

  beforeEach(function() {
    req = new MockRequest({
      apiKey: 'apikey',
      body: { device_id: 'TM-00-03' },
      params: { id: 'TM-00-03'}
    });

    res = new MockResponse();
  });

  describe("#create", function() {
    var tesselFindPromise, userFindPromise, tesselCreatePromise, addUserPromise,
        tessel;

    beforeEach(function() {
      tesselFindPromise = new MockPromise();
      userFindPromise = new MockPromise();
      tesselCreatePromise = new MockPromise();

      addUserPromise = new MockPromise();

      tessel = {
        addUser: stub().returns(addUserPromise)
      }

      stub(Tessel, 'find').returns(tesselFindPromise);
      stub(Tessel, 'create').returns(tesselCreatePromise);
      stub(User, 'find').returns(userFindPromise);
    });

    afterEach(function() {
      Tessel.find.restore();
      Tessel.create.restore();
      User.find.restore();
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
        tesselFindPromise.error.yields();
        controller.create(req, res);
        expect(res.json).to.be.calledWith(500, controller.errors.create);
      });
    });

    context('if the tessel is already registered', function() {
      it('returns a error indicating the tessel already exists', function() {
        tesselFindPromise.success.yields(true);
        controller.create(req, res);
        expect(res.json).to.be.calledWith(400, controller.errors.tesselExists);
      });
    });

    context('if an error is found while looking up the User', function() {
      it('returns a create error', function() {
        tesselFindPromise.success.yields();
        userFindPromise.error.yields();

        controller.create(req, res);
        expect(res.json).to.be.calledWith(500, controller.errors.create);
      });
    });

    context("if the specified User doesn't exist", function() {
      it('returns a create error', function() {
        tesselFindPromise.success.yields();
        userFindPromise.success.yields();

        controller.create(req, res);
        expect(res.json).to.be.calledWith(500, controller.errors.create);
      });
    });

    context('if an error occurs while creating the Tessel', function() {
      it('returns a create error', function() {
        tesselFindPromise.success.yields();
        userFindPromise.success.yields();
        tesselCreatePromise.error.yields();

        controller.create(req, res);
        expect(res.json).to.be.calledWith(500, controller.errors.create);
      });
    });

    context('if the Tessel is created successfully', function() {
      beforeEach(function() {
        tesselFindPromise.success.yields();
        userFindPromise.success.yields('user');
        tesselCreatePromise.success.yields(tessel);
        addUserPromise.success.yields();
      });

      it('adds a relation between the User and Tessel', function() {
        controller.create(req, res);
        expect(tessel.addUser).to.be.calledWith('user');
      })

      it('returns a message indicating as such', function() {
        controller.create(req, res);
        expect(res.json).to.be.calledWith({
          ok: true,
          data: "Tessel was created successfully"
        })
      });
    });
  });

  describe("#delete", function() {
    var userFindPromise, tesselFindPromise, hasTesselPromise,
        removeTesselPromise, tesselDestroyPromise, tessel, user;

    beforeEach(function() {
      userFindPromise = new MockPromise();
      tesselFindPromise = new MockPromise();
      hasTesselPromise = new MockPromise();
      removeTesselPromise = new MockPromise();
      tesselDestroyPromise = new MockPromise();

      tessel = {
        destroy: stub().returns(tesselDestroyPromise)
      }

      user = {
        hasTessel: stub().returns(hasTesselPromise),
        removeTessel: stub().returns(removeTesselPromise),
      }

      stub(User, 'find').returns(userFindPromise);
      stub(Tessel, 'find').returns(tesselFindPromise);
    });

    afterEach(function() {
      User.find.restore();
      Tessel.find.restore();
    });

    context("if no device_id or api_key is passed", function() {
      it('returns a missing params error', function() {
        delete req.params.id;
        controller.delete(req, res);
        expect(res.json).to.be.calledWith(400, controller.errors.missingParams);
      });
    });

    context('if attempting to find the user returns an error', function() {
      it('returns an error message', function() {
        userFindPromise.error.yields();
        controller.delete(req, res);
        expect(res.json).to.be.calledWith(500, controller.errors.del);
      });
    });

    context("if the tessel doesn't exist", function() {
      it('returns an error message', function() {
        userFindPromise.success.yields(user);
        tesselFindPromise.success.yields();
        controller.delete(req, res);
        expect(res.json).to.be.calledWith(400, controller.errors.tesselDoesNotExist);
      });
    });

    context("if the User doesn't own the tessel", function() {
      it('returns an error message', function() {
        userFindPromise.success.yields(user);
        tesselFindPromise.success.yields(tessel);
        hasTesselPromise.success.yields(false);

        controller.delete(req, res);
        expect(res.json).to.be.calledWith(400, controller.errors.tesselDoesNotExist);
      });
    });

    context('if the Tessel is removed from the User and destroyed', function() {
      it('returns a message indicating as such', function() {
        userFindPromise.success.yields(user);
        tesselFindPromise.success.yields(tessel);
        hasTesselPromise.success.yields(true);
        removeTesselPromise.success.yields();
        tesselDestroyPromise.success.yields();

        controller.delete(req, res);
        expect(res.json).to.be.calledWith({
          ok: true,
          data: "Tessel was deleted successfully"
        })
      });
    });
  });
});
