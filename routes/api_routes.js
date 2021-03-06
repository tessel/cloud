'use strict';

var router = require('express').Router();

var App   = require('../controllers/application_controller'),
    Tessels = require('../controllers/tessels_controller'),
    Remote = require('../controllers/remote_controller'),
    Config = require('../controllers/configuration_controller');

// API key settings routes
router.get('/api/user/apikey', Config.apiKey); // get existing API key
router.post('/api/user/apikey', Config.genApiKey); // create and get new API key

// Authenticate API routes with API key
router.all('/api/tessel*', App.authenticate);

// Tessel routes
router.post('/api/tessel', Tessels.create); // create new remote Tessel
router.get('/api/tessel/:device_id', Tessels.details); // list details for one Tessel
router.put('/api/tessel/:device_id', Tessels.update); // update Tessel nickname/ allowed users
router.delete('/api/tessel/:device_id', Tessels.delete); // delete remote Tessel
router.get('/api/tessel', Tessels.list); // list details for all of user's Tessels

// Remote control routes
router.post('/api/tessel/:device_id/code', Remote.code); // tessel run or push as decided by attributes
router.get('/api/tessel/:device_id/network', Remote.network); // get network connection details
router.get('/api/tessel/:device_id/log', Remote.log); // start listening

module.exports = router;
