var db = require('./models'),
    User = db.User,
    Tessel = db.Tessel;

var user = User.build({ authId: 1, apiKey: 'apikey' });
var tessel = Tessel.build({ device_id: 1 });

user.save();
tessel.save();

user.setTessels([tessel])
  .complete(function() {
    console.log(arguments);
  });
