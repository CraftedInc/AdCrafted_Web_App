/**
 * Functions for Creating, Reading, Updating, and Deleting CraftedSpaces.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

// A set of utility functions.
var utils = require("../utils/utils");

/**
 * Create a new CraftedSpace, returning JSON indicating the new CSpaceID.
 */
exports.createCraftedSpace = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var cSpaceID = utils.generateKey(20);
    var cSpaceBody = request.body;
    var params = {
	"TableName": response.app.get("CSpaceTable"),
	"Item": {
	    "UserID": {
		"S": userID
	    },
	    "CSpaceID": {
		"S": cSpaceID
	    },
	    "date": {
		"S": new Date().toISOString()
	    }
	}
    };
    for (var attr in cSpaceBody) {
	if (cSpaceBody[attr] instanceof Array) {
	    params.Item[attr] = {"SS": cSpaceBody[attr]};
	} else {
	    params.Item[attr] = {"S": cSpaceBody[attr]};
	}
    }
    db.putItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    response.send(201, {message: "New CraftedSpace Created",
				ID: cSpaceID});
	}
    });
};

/**
 * Get a single CraftedSpace that the user owns.
 */
exports.getCraftedSpace = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("CSpaceTable"),
	"Key": {
	    "UserID": {
		"S": userID
	    },
	    "CSpaceID": {
		"S": request.params.cSpaceID
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (!utils.isEmpty(data)) {
	    response.send(utils.parseItem(data.Item));
	} else {
	    response.send(404, {message: "CraftedSpace Does Not Exist"});
	}
    });
};

/**
 * Get all CraftedSpaces that the user owns.
 */
exports.getAllUserCraftedSpaces = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("CSpaceTable"),
	"KeyConditions": {
	    "UserID": {
		"ComparisonOperator" : "EQ",
		"AttributeValueList" : [
		    {"S": userID}
		]
	    }
	}
    };
    db.query(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    var result = {message: "Success",
			  Count: data.Count,
			  CraftedSpaces: []};
	    for (var i = 0; i < data.Count; i++) {
		result.CraftedSpaces[i] = utils.parseItem(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

/**
 * Get all public CraftedSpaces.
 */
exports.getAllPublicCraftedSpaces = function(request, response) {
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("CSpaceTable")
    };
    db.scan(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    // TODO: Check if the CraftedSpace is public via a boolean flag.
	    var result = {message: "Success",
			  Count: data.Count,
			  CraftedSpaces: []};
	    for (var i = 0; i < data.Count; i++) {
		result.CraftedSpaces[i] = utils.parseItem(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

/**
 * Updates the specified CraftedSpace. If it doesn't exist, a new CraftedSpace
 * is created.
 */
exports.updateCraftedSpace = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var cSpaceBody = request.body;
    var cSpaceID = request.params.cSpaceID;
    var params = {
	"TableName": response.app.get("CSpaceTable"),
	"AttributeUpdates": {},
	"Key": {
	    "UserID": {
		"S": userID
	    },
	    "CSpaceID": {
		"S": cSpaceID
	    }
	}
    };
    for (var attr in cSpaceBody) {
	if (attr == "CSpaceID" || attr == "UserID") {
	    // These attributes should not be updated.
	    continue;
	} else if (cSpaceBody[attr] instanceof Array) {
	    if (cSpaceBody[attr].length > 0) {
		var uniqueTags = cSpaceBody[attr].filter(function(elem, pos) {
		    return cSpaceBody[attr].indexOf(elem) == pos;
		});
		params.AttributeUpdates[attr] = {
		    "Value": {
			"SS": uniqueTags
		    },
		    "Action": "PUT"
		};
	    } else {
		params.AttributeUpdates[attr] = {
		    "Action": "DELETE"
		};
	    }
	} else {
	    if (!!cSpaceBody[attr]) {
		params.AttributeUpdates[attr] = {
		    "Value": {
			"S": cSpaceBody[attr]
		    },
		    "Action": "PUT"
		};
	    } else {
		params.AttributeUpdates[attr] = {
		    "Action": "DELETE"
		};
	    }
	}
    }
    db.updateItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    response.send(200, {message: "CraftedSpace Updated"});
	}
    });
};

/**
 * Deletes an CraftedSpace and all Ads it references.
 */
exports.deleteCraftedSpace = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var cSpaceID = request.params.cSpaceID;
    var params = {
	"TableName": response.app.get("CSpaceTable"),
	"Key": {
	    "UserID": {
		"S": userID
	    },
	    "CSpaceID": {
		"S": cSpaceID
	    }
	}
    };
    // Delete the CraftedSpace from the database.
    db.deleteItem(params).send();
    // Delete the image it may reference.
    s3.deleteCraftedSpaceFiles(cSpaceID, function(err, data) {});
    // Delete the Ads and the Assets in this CraftedSpace.
    _deleteAssets(request, response, cSpaceID, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    _deleteAds(request, response, cSpaceID, function(err, data) {
		if (err) {
		    response.send(500, {message: "An Error Occurred"});
		} else {
		    response.send(200, {message: "CraftedSpace Deleted"});
		}
	    });
	}
    });
};

/**
 * Private helper functions.
 */

/**
 * Private helper function to delete all Assets in a CraftedSpace.
 */
function _deleteAssets(request, response, cSpaceID, callback) {
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var params = {
	"TableName": response.app.get("AssetTable"),
	"KeyConditions": {
	    "CSpaceID": {
		"AttributeValueList" : [{
		    "S": request.params.cSpaceID
		}],
		"ComparisonOperator" : "EQ"
	    }
	}
    };
    db.query(params, function(err, data) {
	if (err || data.Count == 0) {
	    callback.call(this, err, data);
	} else {
	    var batch = [];
	    for (var i = 0; i < data.Count; i++) {
		// Delete any images the asset may reference.
		s3.deleteAssetFiles(cSpaceID, data.Items[i].AssetID.S,
				    function(err, data) {});
		batch[i] = {
                    "DeleteRequest": {
			"Key": {
			    "CSpaceID": {
				"S": cSpaceID
			    },
			    "AssetID": {
				"S": data.Items[i].AssetID.S
			    }
			}
		    }
		};
	    }
	    params = {
		"RequestItems": {}
	    };
	    params.RequestItems[response.app.get("AssetTable")] = batch;
	    db.batchWriteItem(params, function(err, data) {
		callback.call(this, err, data);
	    });
	}
    });
}

/**
 * Private helper function to delete all Ads in a CraftedSpace.
 */
function _deleteAds(request, response, cSpaceID, callback) {
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var params = {
	"TableName": response.app.get("AdTable"),
	"KeyConditions": {
	    "CSpaceID": {
		"AttributeValueList" : [{
		    "S": request.params.cSpaceID
		}],
		"ComparisonOperator" : "EQ"
	    }
	}
    };
    db.query(params, function(err, data) {
	if (err || data.Count == 0) {
	    callback.call(this, err, data);
	} else {
	    var batch = [];
	    for (var i = 0; i < data.Count; i++) {
		// Delete any images the ad may reference.
		s3.deleteAdImage(cSpaceID, data.Items[i].AdID.N,
				 function(err, data) {});
		batch[i] = {
                    "DeleteRequest": {
			"Key": {
			    "CSpaceID": {
				"S": cSpaceID
			    },
			    "AdID": {
				"N": data.Items[i].AdID.N
			    }
			}
		    }
		};
	    }
	    params = {
		"RequestItems": {}
	    };
	    params.RequestItems[response.app.get("AdTable")] = batch;
	    db.batchWriteItem(params, function(err, data) {
		callback.call(this, err, data);
	    });
	}
    });
}
