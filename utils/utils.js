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
    for(var i in obj){
        if(obj.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
};

/**
 * Checks if the value is an integer.
 */
exports.isInt = function(n) {
   return typeof n === 'number' && n % 1 == 0;
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
 * Creates a request parameters object for the AdSpace table.
 */
exports.adSpaceParams = function(tableName, adSpaceID) {
    return {
	"TableName": tableName,
	"Key": {
	    "AdSpaceID": {
		"S": adSpaceID
	    }
	}
    };
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
    return function(req, res, next) {
	if (!req.isAuthenticated || !req.isAuthenticated()) {
	    res.send(403, "Not authenticated.");
	} else {
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
