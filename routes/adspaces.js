/**
 * Functions for Creating, Reading, Updating, and Deleting AdSpaces.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

// A set of utility functions.
var utils = require("../utils/utils");

/**
 * Create a new AdSpace, returning JSON indicating the new AdSpaceID.
 */
exports.createAdSpace = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var adSpaceID = utils.generateKey(20);
    var adspace_body = request.body;
    var params = {
	"TableName": response.app.get("adspace_table_name"),
	"Item": {
	    "UserID": {
		"S": userID
	    },
	    "AdSpaceID": {
		"S": adSpaceID
	    },
	    "date": {
		"S": new Date().toISOString()
	    },
	    "image": {
		"S": "null"
	    }
	}
    };
    for (var attr in adspace_body) {
	// The image attribute is a Base64 encoded file and must be processed
	// separately.
	if (attr == "image" && !!adspace_body["image"]) {
	    var file = utils.parseBase64Data(adspace_body[attr]);
	    if (file.isBase64) {
		var name = utils.generateKey(8);
		var key = s3.generateAdSpaceKey(adSpaceID, name, file.ext);
		s3.upload(file.body, key, "image/" + file.ext,
			  function(err, data) {
			      if (err) {
				  console.log(err);
			      }
			  });
		params.Item[attr] = {
		    "S": s3.getAdSpaceImageURL(adSpaceID, name, file.ext)
		};
	    }
	} else if (adspace_body[attr] instanceof Array) {
	    params.Item[attr] = {"SS": adspace_body[attr]};
	} else {
	    params.Item[attr] = {"S": adspace_body[attr]};
	}
    }
    db.putItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    response.send(201, {message: "New AdSpace Created",
				AdSpaceID: adSpaceID});
	}
    });
};

/**
 * Get a single AdSpace that the user owns.
 */
exports.getAdSpace = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("adspace_table_name"),
	"Key": {
	    "UserID": {
		"S": userID
	    },
	    "AdSpaceID": {
		"S": request.params.adspace_id
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (!utils.isEmpty(data)) {
	    response.send(utils.parseItem(data.Item));
	} else {
	    response.send(404, {message: "AdSpace Does Not Exist"});
	}
    });
};

/**
 * Get all AdSpaces that the user owns.
 */
exports.getAllUserAdSpaces = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("adspace_table_name"),
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
			  AdSpaces: []};
	    for (var i = 0; i < data.Count; i++) {
		result.AdSpaces[i] = utils.parseItem(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

/**
 * Get all public AdSpaces.
 */
exports.getAllPublicAdSpaces = function(request, response) {
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("adspace_table_name")
    };
    db.scan(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    // TODO: Check if the AdSpace is public via a boolean flag.
	    var result = {message: "Success",
			  Count: data.Count,
			  AdSpaces: []};
	    for (var i = 0; i < data.Count; i++) {
		result.AdSpaces[i] = utils.parseItem(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

/**
 * Updates the specified AdSpace. If it doesn't exist, a new AdSpace is created.
 */
exports.updateAdSpace = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var adspace_body = request.body;
    var adspace_id = request.params.adspace_id;
    var params = {
	"TableName": response.app.get("adspace_table_name"),
	"AttributeUpdates": {},
	"Key": {
	    "UserID": {
		"S": userID
	    },
	    "AdSpaceID": {
		"S": adspace_id
	    }
	}
    };
    for (var attr in adspace_body) {
	if (attr == "AdSpaceID" || attr == "UserID") {
	    // These attributes should not be updated.
	    continue;
	} else if (attr == "image") {
	    var file = utils.parseBase64Data(adspace_body[attr]);
	    if (file.isBase64) {
		var name = utils.generateKey(8);
		var key = s3.generateAdSpaceKey(adspace_id, name, file.ext);
		s3.upload(file.body, key, "image/" + file.ext,
			  function(err, data) {
			      if (err) {
				  console.log(err);
			      }
			  });
		params.AttributeUpdates[attr] = {
		    "Value": {
			"S": s3.getAdSpaceImageURL(adspace_id, name, file.ext)
		    },
		    "Action": "PUT"
		};
	    }
	} else if (adspace_body[attr] instanceof Array) {
	    if (adspace_body[attr].length > 0) {
		var uniqueTags = adspace_body[attr].filter(function(elem, pos) {
		    return adspace_body[attr].indexOf(elem) == pos;
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
	    if (!!adspace_body[attr]) {
		params.AttributeUpdates[attr] = {
		    "Value": {
			"S": adspace_body[attr]
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
	    console.log(err);
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    response.send(200, {message: "AdSpace Updated"});
	}
    });
};

/**
 * Deletes an AdSpace and all Ads it references.
 */
exports.deleteAdSpace = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var adSpaceID = request.params.adspace_id;
    var params = {
	"TableName": response.app.get("adspace_table_name"),
	"Key": {
	    "UserID": {
		"S": userID
	    },
	    "AdSpaceID": {
		"S": adSpaceID
	    }
	}
    };
    // Delete the AdSpace from the database.
    db.deleteItem(params).send();
    // Delete the image it may reference.
    s3.deleteAdSpaceImage(adSpaceID, function(err, data) {});
    // Reassign params to facilitate a query of the Ads table.
    params = {
	"TableName": response.app.get("ads_table_name"),
	"KeyConditions": {
	    "AdSpaceID": {
		"AttributeValueList" : [{
		    "S": request.params.adspace_id
		}],
		"ComparisonOperator" : "EQ"
	    }
	}
    };
    db.query(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (data.Count > 0) {
	    var batch = [];
	    for (var i = 0; i < data.Count; i++) {
		// Delete any images the ad may reference.
		s3.deleteAdImage(adSpaceID, data.Items[i].AdID.N,
				 function(err, data) {});
		batch[i] = {
                    "DeleteRequest": {
			"Key": {
			    "AdSpaceID": {
				"S": adSpaceID
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
	    params.RequestItems[response.app.get("ads_table_name")] = batch;
	    db.batchWriteItem(params, function(err, data) {
		if (err) {
		    response.send(500, {message: "An Error Occurred"});
		} else {
		    response.send(200, {message: "AdSpace Deleted"});
		}
	    });
	} else {
	    response.send(200, {message: "AdSpace Deleted"});
	}
    });
};
