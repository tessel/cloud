'use strict';

var sinon = require('sinon'),
    spy = sinon.spy(),
    stub = sinon.stub();

// A mock version of http.ClientRequest to be used in tests
var MockRequest = module.exports = function MockRequest() {};
