/**
 * Functions for Creating, Reading, Updating, and Deleting Assets.
 *
 * Author: James Pasko (james@appcrafted.com).
 */

// A set of jobs that can be scheduled using the job scheduler.
var jobs = require("../utils/jobs");

// A set of utility functions.
var utils = require("../utils/utils");

// Configuration.
var config = require("../config");

/**
 * Create a new Asset within the specified CraftedSpace.
 */
exports.createAsset = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var asset = request.body;
    var cSpaceID = request.params.cSpaceID;
    // Retrieve the CraftedSpace.
    var params = {
	"TableName": response.app.get("CSpaceTable"),
	"Key": {
	    "CSpaceID": {
		"S": cSpaceID
	    },
	    "UserID" : {
		"S": userID
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (utils.isEmpty(data)) {
	    response.send(400, {message: "CraftedSpace Does Not Exist"});
	} else {
	    params = {
		"TableName": response.app.get("AssetTable"),
		"KeyConditions": {
		    "CSpaceID": {
			"ComparisonOperator" : "EQ",
			"AttributeValueList" : [
			    {"S": cSpaceID}
			]
		    }
		}
	    };
	    // Query to determine how many Assets this CraftedSpace contains,
	    // and select an appropriate AssetID.
	    db.query(params, function(err, data) {
		if (err) {
		    response.send(500, {message: "An Error Occurred"});
		} else {
		    // Determine which AssetID to use.
		    if (!request.body.assetID) {
			var newAssetID = 0;
			var occupied = [];
			if (data.Count > 0) {
			    // Find the smallest available AssetID.
			    for (var i = 0; i < data.Count; i++) {
				var id = data.Items[i].AssetID.S;
				if (utils.isPositiveInteger(id)) {
				    occupied[parseInt(id)] = true;
				}
			    }
			    newAssetID = occupied.length;
			    for (var j = 0; j < occupied.length; j++) {
				if (!occupied[j]) {
				    newAssetID = j;
				    break;
				}
			    }
			}
		    } else if (utils.isAlphanumeric(request.body.assetID)) {
			var newAssetID = request.body.assetID;
			// Check that the AssetID is unique.
			if (data.Count > 0) {
			    for (var i = 0; i < data.Count; i++) {
				var id = data.Items[i].AssetID.S;
				if (id === newAssetID) {
				    response.send(500, {
					message: "AssetID Not Unique"
				    });
				    return;
				}
			    }
			}
		    } else {
			response.send(500, {
			    message: "AssetID Must Be Alphanumeric"
			});
			return;
		    }
		    delete request.body.assetID;
		    params = {
			"TableName": response.app.get("AssetTable"),
			"Item": {
			    "CSpaceID": {
				"S": cSpaceID
			    },
			    "AssetID": {
				"S": newAssetID + ""
			    },
			    "UserID" : {
				"S": userID
			    },
			    "AssetCreatedDate": {
				"S": new Date().toISOString()
			    }
			}
		    };
		    for (var attr in asset) {
			// Reject these attributes, as they've already been set.
			if (attr == "AssetID" || attr == "CSpaceID" ||
			    attr == "UserID" || attr == "AssetCreatedDate") {
			    response.send(500, {
				message: "Prohibited Attribute Name"
			    });
			    return;
			}
			// Get the attribute type and value.
			var type = !!asset[attr][config.ATTRIBUTE_TYPE_KEY] ?
			    asset[attr][config.ATTRIBUTE_TYPE_KEY] : null;
			// Check that the type is supported.
			if (!type || (type != config.STRING_TYPE &&
				      type != config.URL_TYPE &&
				      type != config.IMAGE_TYPE &&
				      type != config.FILE_TYPE &&
				      type != config.STRING_ARRAY_TYPE &&
				      type != config.NUMBER_ARRAY_TYPE &&
				      type != config.NUMBER_TYPE)) {
			    // If the type is not supported, send an error.
			    response.send(500, {
				message: "Data Type Not Supported"
			    });
			    return;
			}
			var value = !!asset[attr][config.ATTRIBUTE_VALUE_KEY] ?
			    asset[attr][config.ATTRIBUTE_VALUE_KEY] : null;
			// File and image attributes are Base64 encoded and must
			// be processed separately.
			if ((type == config.IMAGE_TYPE ||
			     type == config.FILE_TYPE) && !!value) {
			    var file = utils.parseBase64Data(value);
			    if (file.isBase64) {
				var mime = type === config.IMAGE_TYPE ?
				    "image/" : "application/";
				var name = utils.generateKey(8);
				var key = s3.generateAssetKey(cSpaceID,
							      newAssetID,
							      name, file.ext);
				s3.upload(file.body, key, mime + file.ext,
					  function(err, data) {
					      if (err) {
						  console.log(err);
					      }
					  });
				params.Item[attr] = {
				    "S": '{"' + config.ATTRIBUTE_TYPE_KEY +
					'":"' + type + '","' +
					config.ATTRIBUTE_VALUE_KEY + '":"' +
					s3.getAssetFileURL(cSpaceID,
							   newAssetID,
							   name, file.ext) +
					'"}'
				};
			    } else {
				response.send(500, {
				    message: "File Not Base64-Encoded"
				});
				return;
			    }
			} else if (!!type && !!value) {
			    params.Item[attr] = {
				"S": '{"' + config.ATTRIBUTE_TYPE_KEY + '":"' +
				    type + '","' +
				    config.ATTRIBUTE_VALUE_KEY + '":"' +
				    value + '"}'
			    };
			} else {
			    response.send(500, {
				message: "Missing or Incorrect Parameter"
			    });
			    return;
			}
		    }
		    // Finally, put the new asset.
		    db.putItem(params, function(err, data) {
			if (err) {
			    response.send(500, {message: "An Error Occurred"});
			} else {
			    response.send(201, {message: "New Asset Created",
						ContainerID: cSpaceID,
						AssetID: newAssetID});
			}
		    });
		}
	    });
	}
    });
};

/**
 * Get a single Asset specified by the AssetID and CSpaceID.
 */
exports.getAsset = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("AssetTable"),
	"Key": {
	    "CSpaceID": {
		"S": request.params.cSpaceID
	    },
	    "AssetID" : {
		"S": request.params.assetID + ""
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (!utils.isEmpty(data)) {
	    if (!!data.Item.UserID && data.Item.UserID.S == userID) {
		// The user must own either this Asset or its CraftedSpace.
		response.send(200, utils.parseAsset(data.Item));
	    } else {
		response.send(403, {message: "Not Authorized"});
	    }
	} else {
	    response.send(404, {message: "No Such Asset"});
	}
    });
};

/**
 * Gets all Assets belonging to the specified user.
 */
exports.getAllUserAssets = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("AssetTable")
    };
    db.scan(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    var count = 0;
	    var result = {message: "Success",
			  Assets: []};
	    for (var i = 0; i < data.Count; i++) {
		if (!!data.Item.UserID && data.Item.UserID.S == userID) {
		    result.Assets[count++] = utils.parseAsset(data.Items[i]);
		}
	    }
	    result.Count = count;
	    response.send(result);
	}
    });
};

/**
 * Get all assets in the specified CraftedSpace.
 */
exports.getAllAssetsInCraftedSpace = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("AssetTable"),
	"IndexName": config.ASSET_USER_ID_INDEX,
	"KeyConditions": {
	    "CSpaceID": {
		"ComparisonOperator" : "EQ",
		"AttributeValueList" : [
		    {"S": request.params.cSpaceID}
		]
	    },
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
			  Assets: []};
	    for (var i = 0; i < data.Count; i++) {
		result.Assets[i] = utils.parseAsset(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

/**
 * Updates the specified asset. If it doesn't exist, a new asset is created.
 */
exports.updateAsset = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var asset = request.body;
    var cSpaceID = request.params.cSpaceID;
    var assetID = request.params.assetID;
    var params = {
	"TableName": response.app.get("AssetTable"),
	"Key": {
	    "CSpaceID": {
		"S": cSpaceID
	    },
	    "AssetID" : {
		"S": assetID + ""
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	    return;
	}
	// If the item doesn't exist, then ensure that the AssetCreatedDate
	// and UserID attributes are set.
	if (utils.isEmpty(data)) {
	    // Check the CraftedSpace to see if the userID matches.
	    response.send(500, {message: "Asset Does Not Exist"});
	    return;
	}
	if (!!data.Item.UserID && data.Item.UserID.S == userID) {
	    // The user must own this Asset in order to update it.
	    params = {
		"TableName": response.app.get("AssetTable"),
		"Key": {
		    "CSpaceID": {
			"S": cSpaceID
		    },
		    "AssetID": {
			"S": assetID + ""
		    }
		},
		"AttributeUpdates": {}
	    };
	    for (var attr in asset) {
		// Reject these attributes, as they shouldn't be changed.
		if (attr == "AssetID" || attr == "CSpaceID" ||
		    attr == "UserID" || attr == "AssetCreatedDate") {
		    response.send(500, {
			message: "Prohibited Attribute Name"
		    });
		    return;
		}
		// Get the attribute type, value, and action.
		var type = !!asset[attr][config.ATTRIBUTE_TYPE_KEY] ?
		    asset[attr][config.ATTRIBUTE_TYPE_KEY] : null;
		// Check that the type is supported.
		if (!!type &&
		    type != config.STRING_TYPE && type != config.URL_TYPE &&
		    type != config.IMAGE_TYPE && type != config.FILE_TYPE &&
		    type != config.STRING_ARRAY_TYPE &&
		    type != config.NUMBER_ARRAY_TYPE &&
		    type != config.NUMBER_TYPE) {
		    // If the type is not supported, set it to null.
		    type = null;
		}
		var value = !!asset[attr][config.ATTRIBUTE_VALUE_KEY] ?
		    asset[attr][config.ATTRIBUTE_VALUE_KEY] : null;
		var action = !!asset[attr][config.ATTRIBUTE_ACTION_KEY] ?
		    asset[attr][config.ATTRIBUTE_ACTION_KEY] : null;
		// File and image attributes are Base64 encoded and must
		// be processed separately.
		if ((type == config.IMAGE_TYPE || type == config.FILE_TYPE)
		    && !!value && action == config.UPDATE_ATTRIBUTE_ACTION) {
		    var file = utils.parseBase64Data(value);
		    if (file.isBase64) {
			var mime = type === config.IMAGE_TYPE ?
			    "image/" : "application/";
			var name = utils.generateKey(8);
			var key = s3.generateAssetKey(cSpaceID, assetID,
						      name, file.ext);
			s3.upload(file.body, key, mime + file.ext,
				  function(err, data) {
				      if (err) {
					  console.log(err);
				      }
				  });
			params.AttributeUpdates[attr] = {
			    "Value": {
				"S": '{"' + config.ATTRIBUTE_TYPE_KEY +
				    '":"' + type + '","' +
				    config.ATTRIBUTE_VALUE_KEY + '":"' +
				    s3.getAssetFileURL(cSpaceID,
						       assetID,
						       name, file.ext) + '"}'
			    },
			    "Action": "PUT"
			};
		    }
		} else if (action == config.DELETE_ATTRIBUTE_ACTION) {
		    params.AttributeUpdates[attr] = {
			"Action": "DELETE"
		    };
		} else if (!!type && !!value &&
			   action == config.UPDATE_ATTRIBUTE_ACTION) {
		    params.AttributeUpdates[attr] = {
			"Value": {
			    "S": '{"' + config.ATTRIBUTE_TYPE_KEY + '":"' +
				type + '","' +
				config.ATTRIBUTE_VALUE_KEY + '":"' +
				value + '"}'
			},
			"Action": "PUT"
		    };
		} else {
		    response.send(500, {
			message: "Missing or Incorrect Parameter"
		    });
		    return;
		}
	    }
	    db.updateItem(params, function(err, data) {
		if (err) {
		    response.send(500, {message: "An Error Occurred"});
		} else {
		    response.send(200, {message: "Asset Updated"});
		}
	    });
	} else {
	    response.send(403, {message: "Not Authorized"});
	}
    });
};

/**
 * Deletes the specified Asset if it exists without deleting the CraftedSpace.
 */
exports.deleteAsset = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var cSpaceID = request.params.cSpaceID;
    var assetID = request.params.assetID;
    var params = {
	"TableName": response.app.get("AssetTable"),
	"Key": {
	    "CSpaceID": {
		"S": cSpaceID
	    },
	    "AssetID" : {
		"S": assetID + ""
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (!!data.Item.UserID && data.Item.UserID.S == userID) {
	    // The user must own this Asset in order to delete it.
	    db.deleteItem(params, function(err, data) {
		if (err) {
		    response.send(500, {message: "An Error Occurred"});
		} else {
		    // Delete any files the asset may reference.
		    s3.deleteAssetFiles(cSpaceID, assetID,
					function(err, data) {
					    response.send(200,
							  {message:
							   "Asset Deleted"});
					});
		}
	    });
	} else {
	    response.send(403, {message: "Not Authorized"});
	}
    });
};

/**
 * Returns the metrics for the asset.
 */
exports.getMetrics = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var id = request.params.cSpaceID + request.params.assetID;
    var params = {
	"TableName": response.app.get("AssetMetricsTable"),
	"KeyConditions": {
	    "ID": {
		"ComparisonOperator" : "EQ",
		"AttributeValueList" : [
		    {"S": id}
		]
	    }
	}
    };
    db.query(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    var result = [];
	    for (var i = 0; i < data.Count; i++) {
		result[i] = utils.parseItem(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

/**
 * Registers a set of impressions and/or clicks.
 */
exports.updateMetrics = function(request, response) {
    var userID = request.user.id;
    var jobScheduler = response.app.get("jobScheduler");
    var impressions = request.body.impressions || 0;
    var clicks = request.body.clicks || 0;
    if ((utils.isInt(impressions) && utils.isInt(clicks)) &&
	(impressions > 0 || clicks > 0)) {
	// Create an MetricsJob and add it to the Job Scheduler.
	var metricsJob =
	    new jobs.MetricsJob(response.app.get("db"),
				response.app.get("AssetMetricsTable"),
				request.params.cSpaceID,
				request.params.assetID,
				impressions,
				clicks);
	jobScheduler.add(metricsJob);
	response.send(200, {message: "Metrics Updated"});
    } else {
	response.send(400, {message: "Invalid Request Body"});
    }
};
