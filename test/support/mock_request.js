'use strict';

var sinon = require('sinon'),
    spy = sinon.spy(),
    stub = sinon.stub();

// A mock version of http.ClientRequest to be used in tests
var MockRequest = module.exports = function MockRequest(opts) {
  if (opts == null) {
    opts = {};
  }

  var opt;

  for (opt in opts) {
    this[opt] = opts[opt];
  }
};
