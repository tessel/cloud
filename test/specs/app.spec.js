'use strict';

var app = source("app");

describe("App", function() {
  it("is an Express app", function() {
    var methods = ["get", "post", "put", "delete"];

    for (var i = 0; i < methods.length; i++) {
      var method = methods[i];
      expect(app[method]).to.be.a('function');
    }
  });
});
