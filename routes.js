'use strict';

var router = require('express').Router();

var App   = require('./controllers/application_controller'),
    Tessels = require('./controllers/tessels_controller'),
    v1    = require('./controllers/v1_controller');

// Tessel routes
router.all('/tessels/*', App.authenticate)
router.post('/tessels', Tessels.create);
router.put('/tessels/:id', Tessels.update);
router.delete('/tessels/:id', Tessels.delete);

// API /v1 routes
router.all('/v1/*', App.authenticate)
router.get('/v1/tessels', v1.list)
router.get('/v1/tessels/:device_id', v1.details)
router.put('/v1/tessels/:device_id', v1.push)

module.exports = router;
