'use strict';

// allow production modules to expose internal
// functions and properties for testing
process.env.NODE_ENV = 'test';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

global.chai = chai;
global.should = chai.should();
global.expect = chai.expect;
global.assert = chai.assert;
global.AssertionError = chai.AssertionError;
global.sinon = sinon;
global.spy = sinon.spy
global.stub = sinon.stub

chai.use(sinonChai);

// can be used by test modules to require production modules,
// relative to the base path
global.source = function (src) {
  var resource = require('path').normalize('../../' + src);
  return require(resource);
};
