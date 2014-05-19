require('dotenv').load();

module.exports = {
  "server": process.env.OAUTH_SERVER,
  "authorisePath": process.env.OAUTH_AUTH_PATH,
  "tokenPath": process.env.OAUTH_TOKEN_PATH,
  "profilePath": process.env.OAUTH_PROFILE_PATH
}
