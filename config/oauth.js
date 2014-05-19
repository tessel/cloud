require('dotenv').load();

module.exports = {
  "server": process.env.OAUTH_SERVER,
  "authorisePath": "oauth/authorise",
  "tokenPath": "oauth/token",
  "profilePath": "users/profile"
}
