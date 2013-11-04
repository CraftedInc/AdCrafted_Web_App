/**
 * Functions for Creating, Reading, Updating, and Deleting AdSpaces.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

//UUIDs are used as AdSpace identifiers.
var uuid = require("node-uuid");

// A set of utility functions.
var utils = require("../utils/utils");

/**
 * Create a new AdSpace, returning JSON indicating the new AdSpaceID.
 */
exports.createAdSpace = function(request, response) {
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var adspace_id = uuid.v4();
    var adspace_body = request.body;
    var params = {
	"TableName": response.app.get("adspace_table_name"),
	"Item": {
	    "AdSpaceID": {
		"S": adspace_id
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
		var name = uuid.v4();
		var key = s3.generateAdSpaceKey(adspace_id, name, file.ext);
		s3.upload(file.body, key, "image/" + file.ext,
			  function(err, data) {
			      if (err) {
				  console.log(err);
			      }
			  });
		params.Item[attr] = {
		    "S": s3.getAdSpaceImageURL(adspace_id, name, file.ext)
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
	    response.send(err);
	} else {
	    response.send( {"status": 201,
			    "message": "Success",
			    "AdSpaceID": adspace_id} );
	}
    });
};

/**
 * Get a single AdSpace.
 */
exports.getAdSpace = function(request, response) {
    var db = response.app.get("db");
    var params = utils.adSpaceParams(response.app.get("adspace_table_name"),
				       request.params.adspace_id);
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else if (!utils.isEmpty(data)) {
	    response.send(utils.parseItem(data.Item));
	} else {
	    response.send({"status": 404,
			   "message": "AdSpace does not exist"});
	}
    });
};

/**
 * Get all AdSpaces.
 */
exports.getAllAdSpaces = function(request, response) {
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("adspace_table_name")
    };
    db.scan(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    var result = {"status": 200,
			  "Count": data.Count,
			  "AdSpaces": []};
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
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var adspace_body = request.body;
    var adspace_id = request.params.adspace_id;
    var params = {
	"TableName": response.app.get("adspace_table_name"),
	"Key": {
	    "AdSpaceID": {
		"S": adspace_id
	    }
	},
	"AttributeUpdates": {}
    };
    for (var attr in adspace_body) {
	if (attr == "AdSpaceID") {
	    continue;
	} else if (attr == "image") {
	    var file = utils.parseBase64Data(adspace_body[attr]);
	    if (file.isBase64) {
		var name = uuid.v4();
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
	    params.AttributeUpdates[attr] = {
		"Value": {
		    "SS": adspace_body[attr]
		},
		"Action": "PUT"
	    };
	} else {
	    params.AttributeUpdates[attr] = {
		"Value": {
		    "S": adspace_body[attr]
		},
		"Action": "PUT"
	    };
	}
    }
    db.updateItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    response.send( {"status": 200,
			    "message": "Success"} );
	}
    });
};

/**
 * Deletes an AdSpace and all Ads it references.
 */
exports.deleteAdSpace = function(request, response) {
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var adSpaceID = request.params.adspace_id;
    var params = utils.adSpaceParams(response.app.get("adspace_table_name"),
				       request.params.adspace_id);
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
	    response.send(err);
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
		    response.send(err);
		} else {
		    response.send( {"status": 200,
				    "message": "Success"} );
		}
	    });
	} else {
	    response.send( {"status": 200,
			    "message": "Success"} );
	}
    });
};
