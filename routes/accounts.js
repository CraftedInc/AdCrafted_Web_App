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
 * Checks the database for the user and creates a new record if none exists.
 */
exports.findOrCreate = function(db,
				oAuth2Table,
				userTable,
				oAuth2ID,
				name,
				email,
				done) {
    // First, check if the mapping from OAuth2ID --> UserID exists.
    var params = {
	"TableName": oAuth2Table,
	"Key": {
	    "OAuth2ID": {
		"S": oAuth2ID
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    // Some error occured.
	    return done(err, null);
	} else if (utils.isEmpty(data)) {
	    // The records don't yet exist. Create them.
	    // Generate a user ID.
	    var userID = utils.generateKey(20);
	    params = {
		"TableName": oAuth2Table,
		"Item": {
		    "OAuth2ID": {
			"S": oAuth2ID
		    },
		    "UserID": {
			"S": userID
		    }
		}
	    };
	    db.putItem(params, function(err, data) {
		if (err) {
		    return done(err, null);
		} else {
		    // Generate a secret key for authentication purposes.
		    var secret = utils.generateKey(20);
		    params = {
			"TableName": userTable,
			"Item": {
			    "UserID": {
				"S": userID
			    },
			    "SecretKey": {
				"S": secret
			    }
			}
		    };
		    if (email) {
			params.Item.Email = {"S": email + ""};
		    }
		    if (name) {
			params.Item.Name = {"S": name + ""};
		    }
		    db.putItem(params, function(err, data) {
			if (err) {
			    // Delete the associated OAuth2 table record if the
			    // user record didn't write correctly.
			    params = {
				"TableName": oAuth2Table,
				"Item": {
				    "OAuth2ID": {
					"S": oAuth2ID
				    }
				}
			    };
			    db.deleteItem(params).send();
			    return done(err, null);
			} else {
			    return done(null, {id: userID, email: email});
			}
		    });
		}
	    });
	} else {
	    // The records already exist
	    var userID = data.Item.UserID.S;
	    return done(null, {id: userID, email: email});
	}
    });
};

/**
 * GET the user's account.
 */
exports.getAccount = function(request, response) {
    var db = request.app.get("db");
    var params = {
	"TableName": request.app.get("UserTable"),
	"Key": {
	    "UserID": {
		"S": request.user.id
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (utils.isEmpty(data)) {
	    response.send(404, {message: "The Account Doesn't Exist"});
	} else {
	    response.send(utils.parseItem(data.Item));
	}
    });
};

/**
 * PUT (update) the user's account.
 */
exports.updateAccount = function(request, response) {
    var db = request.app.get("db");
    var account = request.body;
    var params = {
	"TableName": request.app.get("UserTable"),
	"Key": {
	    "UserID": {
		"S": request.user.id
	    }
	},
	"AttributeUpdates": {}
    };
    for (var attr in account) {
	if (attr == "Name" || attr == "Email") {
	    params.AttributeUpdates[attr] = {
		"Value": {
		    "S": account[attr]
		},
		"Action": "PUT"
	    };
	}
    }
    db.updateItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    response.send(200, {message: "Account Successfully Updated"});
	}
    });
};
