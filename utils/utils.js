/**
 * A set of utility functions.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

var config = require("./../config");

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
   return typeof n === "number" && n % 1 == 0;
};

/**
 * Checks if the string is a nonnegative integer.
 */
exports.isPositiveInteger = function(str) {
    return str >>> 0 === parseFloat(str);
};

/**
 * Checks if the string contains only alphanumeric characters ('-' and '_' included).
 */
exports.isAlphanumeric = function(str) {
    var regex = /^[a-zA-Z0-9-_]+$/;
    return regex.test(str);
};

/**
 * Tests (via regex) whether a string is a valid email address.
 */
exports.isEmail = function(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
};

/**
 * Returns the estimated size of Base64-encoded file after it's been decoded.
 */
exports.base64FileSize = function(base64File) {
    return base64File.length / 1333;
};

/**
 * Determines whether the string is a correctly-encoded Base64 file and also
 * determines its size in KB.
 */
exports.validateBase64File = function(base64File) {
    var size = base64File.length / 1333;
    var matches =
	base64File.substring(0,150).match(/^data:.+\/(.+);base64,(.*)$/);
    return {
	size: size,
	isBase64: !!matches && matches.length == 3
    };
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
	    "body": new Buffer(matches[2], "base64")
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
 * Parses an Asset.
 */
exports.parseAsset = function(item) {
    var result = {};
    for (var attr in item) {
	var attribute = item[attr];
	var value = attribute["N"] ?
	    attribute["N"] : attribute["S"] ?
	    attribute["S"] : attribute["SS"] ?
	    attribute["SS"] : null;
	try {
	    // If AssetID is a string-number, it will be parsed without an
	    // exception. However, we want to keep it as a string.
	    if (attr != "AssetID") {
		result[attr] = JSON.parse(value);
	    }
	    if (result[attr][config.ATTRIBUTE_TYPE_KEY] == config.NUMBER_TYPE) {
		result[attr][config.ATTRIBUTE_VALUE_KEY] =
		    parseFloat(result[attr][config.ATTRIBUTE_VALUE_KEY]);
	    } else if (result[attr][config.ATTRIBUTE_TYPE_KEY] ==
		       config.STRING_ARRAY_TYPE) {
		var regex = /\s*,\s*/;
		result[attr][config.ATTRIBUTE_VALUE_KEY] =
		    (result[attr][config.ATTRIBUTE_VALUE_KEY]).split(regex);
	    } else if (result[attr][config.ATTRIBUTE_TYPE_KEY] ==
		       config.NUMBER_ARRAY_TYPE) {
		var regex = /\s*,\s*/;
		var numbers =
		    (result[attr][config.ATTRIBUTE_VALUE_KEY]).split(regex);
		for (var i = 0; i < numbers.length; i++) {
		    numbers[i] = parseFloat(numbers[i]);
		}
		result[attr][config.ATTRIBUTE_VALUE_KEY] = numbers;
	    }
	} catch (e) {
	    // Not JSON, so don't parse it.
	    result[attr] = value;
	}
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

/**
 * Returns the size of a Base64 encoded file in KB.
 */
function base64FileSize(s) {
    return (encodeURI(s).split(/%..|./).length - 1) / 1333;
}
