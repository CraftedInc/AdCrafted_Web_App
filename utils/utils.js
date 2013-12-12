/**
 * A set of utility functions.
 *
 * Author: James Pasko (james@adcrafted.com).
 */


/**
 * Tests whether an object is empty (contains no attributes of its own).
 * @param {Object} obj The object to test.
 * @return {boolean} Whether the object is empty.
 */
exports.isEmpty = function(obj) {
    return isEmpty(obj);
};

/**
 * Checks if the value is an integer.
 */
exports.isInt = function(n) {
   return typeof n === 'number' && n % 1 == 0;
};

/**
 * Tests (via regex) whether a string is a valid email address.
 */
exports.isEmail = function(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
};

/**
 * Extracts the metadata from the Base64 encoded data and returns an object
 * containing the metadata and the Base64 encoded body.
 * @param {string} data The URL/Base64 encoded data.
 */
exports.parseBase64Data = function(data){
    var result = {};
    var matches = data.match(/^data:.+\/(.+);base64,(.*)$/);
    if (!!matches && matches.length == 3) {
	result = {
	    "isBase64": true,
	    "ext": matches[1],
	    "body": new Buffer(matches[2], 'base64')
	};
    } else {
	result = {
	    "isBase64": false,
	    "ext": null,
	    "body": null
	};
    }
    return result;
};

/**
 * Parses an item returned from a query or getItem operation.
 */
exports.parseItem = function(item) {
    var result = {};
    for (var attr in item) {
	var attribute = item[attr];
	var value = attribute["N"] ?
	    attribute["N"] : attribute["S"] ?
	    attribute["S"] : attribute["SS"] ?
	    attribute["SS"] : null;
	result[attr] = value;
    }
    return result;
};

/**
 * Ensures that the request is authenticated before proceeding, otherwise
 * returns a 403.
 */
exports.ensureAuthenticated = function() {
    return function(request, response, next) {
	if (!request.isAuthenticated || !request.isAuthenticated()) {
	    response.send(403, "Not Authenticated");
	} else if (!request.user || !request.user.id) {
	    // Ensure that the session exists since routes rely on user IDs.
	    response.send(500, "Error: Session Lost");
	} else {
	    next();
	}
    }
};

/**
 * Ensures that the API request is authenticated before proceeding, otherwise
 * returns a 403.
 */
exports.authenticateAPIRequest = function() {
    return function(request, response, next) {
	request.user = null; // Clear any unauthorized user.
	var header    = request.headers["authorization"] || "",
	    token     = header.split(/\s+/).pop() || "",
	    auth      = new Buffer(token, "base64").toString(),
	    parts     = auth.split(/:/),
	    accessKey = parts[0],
	    signature = parts[1];
	if (!accessKey || !signature) {
	    response.send(403, "Missing or Incorrect Authorization Header");
	} else {
	    var db = request.app.get("db");
	    var params = {
		"TableName": request.app.get("UserTable"),
		"Key": {
		    "UserID": {
			"S": accessKey
		    }
		}
	    };
	    db.getItem(params, function(err, data) {
		if (err) {
		    response.send(500, "Authentication Failed");
		} else if (isEmpty(data)) {
		    response.send(403, "Unrecognized Access Key");
		} else {
		    var secretKey = data.Item.SecretKey ?
			data.Item.SecretKey.S : undefined;
		    if (!!secretKey &&
			computeSignature(request, secretKey) == signature) {
			// Set the id on the user object.
			request.user = {id: accessKey};
			// Continue processing the request.
			next();
		    } else {
			response.send(403, "Signature Not Verified");
		    }
		}
	    });
	}
    }
};

/**
 * Sets the user id without any authentication.
 */
exports.setUserIDOnRequest = function() {
    return function(request, response, next) {
	request.user = null; // Clear any unauthorized user.
	var header    = request.headers["authorization"] || "",
	    token     = header.split(/\s+/).pop() || "",
	    auth      = new Buffer(token, "base64").toString(),
	    parts     = auth.split(/:/),
	    accessKey = parts[0],
	    signature = parts[1];
	if (!accessKey) {
	    response.send(403, "Missing or Incorrect Authorization Header");
	} else {
	    request.user = {id: accessKey};
	    next();
	}
    }
};

/**
 * Parses the request header for the subdomain.
 */
exports.getSubdomain = function(header) {
    var parts = header.split(".");
    return parts.length == 2 ? "www" : parts[0];
};

/**
 * Generates a random key.
 */
exports.generateKey = function(length) {
    var result = "";
    var characters =
	"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	.split("");
    for (var i = 0; i < length; i++) {
	result += characters[Math.floor(Math.random() * (characters.length))];
    }
    return result;
};


/**
 * Private helper functions.
 */

/**
 * Computes the signature of the request using the provided secret key.
 */
function computeSignature(request, secretKey) {
    return secretKey;
}

/**
 * Tests whether an object is empty (contains no attributes of its own).
 */
function isEmpty(obj) {
    for(var i in obj) {
        if(obj.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
}
