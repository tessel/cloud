'use strict';

var router = require('express').Router();

var Index = require('./controllers/index_controller'),
    Users = require('./controllers/users_controller'),
    v1    = require('./controllers/v1_controller');

// Index routes
router.all('/', Index.oauthAuthentication, Index.index);

// Index routes
router.post('/users', Users.create);
router.put('/users/:id', Users.update);
router.delete('/users/:id', Users.delete);

// API /v1 routes
router.all('/v1/*', v1.auth)
router.get('/v1/tessels', v1.list)
router.get('/v1/tessels/:device_id', v1.details)
router.put('/v1/tessels/:device_id', v1.push)

module.exports = router;
