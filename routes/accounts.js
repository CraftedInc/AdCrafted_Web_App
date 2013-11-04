/**
 * Functions for creating accounts, authenticating requests, and managing
 * authenticated sessions.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * Include modules here.
 */
var utils = require("./../utils/utils")
  , uuid  = require("node-uuid");

/**
 * Render a page to login or create an account.
 */
exports.login = function(request, response) {
    request.session.subdomain = utils.getSubdomain(request.headers.host);
    response.redirect(request.app.get("PROTOCOL") + "www." +
		      request.app.get("DOMAIN") + "?signin=true");
};

/**
 * Logout a user.
 */
exports.logout = function(request, response) {
    request.logout();
    response.redirect(request.app.get("PROTOCOL") + "www." +
		      request.app.get("DOMAIN"));
};

/**
 * Checks the database for the user, creating a new record if none exists.
 */
exports.findOrCreate = function(db, tableName, user, done) {
    return done(null, user);
};
