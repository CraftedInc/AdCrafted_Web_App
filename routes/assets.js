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
		    var newAssetID = 0;
		    var occupied = [];
		    if (data.Count > 0) {
			// Find the smallest available AssetID.
			for (var i = 0; i < data.Count; i++) {
			    occupied[parseInt(data.Items[i].AssetID.N)] = true;
			}
			newAssetID = occupied.length;
			for (var j = 0; j < occupied.length; j++) {
			    if (!occupied[j]) {
				newAssetID = j; // Smallest available AssetID.
				break;
			    }
			}
		    }
		    params = {
			"TableName": response.app.get("AssetTable"),
			"Item": {
			    "CSpaceID": {
				"S": cSpaceID
			    },
			    "AssetID": {
				"N": newAssetID + ""
			    },
			    "UserID" : {
				"S": userID
			    },
			    "date": {
				"S": new Date().toISOString()
			    }
			}
		    };
		    for (var attr in asset) {
			// Skip over items containing an empty string.
			if (asset[attr] == "") {
			    continue;
			}
			// The image attribute is a Base64 encoded file and must
			// be processed separately.
			if (attr == "image" && !!asset["image"]) {
			    var file = utils.parseBase64Data(asset[attr]);
			    if (file.isBase64) {
				var name = utils.generateKey(8);
				var key = s3.generateAssetKey(cSpaceID,
							      newAssetID,
							      name, file.ext);
				s3.upload(file.body, key, "image/" + file.ext,
					  function(err, data) {
					      if (err) {
						  console.log(err);
					      }
					  });
				params.Item["image"] = {
				    "S": s3.getAssetImageURL(cSpaceID,
							     newAssetID,
							     name, file.ext)
				};
			    }
			} else if (asset[attr] instanceof Array) {
			    params.Item[attr] = {"SS": asset[attr]};
			} else {
			    params.Item[attr] = {"S": asset[attr]};
			}
		    }
		    // Finally, put the new asset.
		    db.putItem(params, function(err, data) {
			if (err) {
			    response.send(500, {message: "An Error Occurred"});
			} else {
			    response.send(201, {message: "New Asset Created",
						CSpaceID: cSpaceID,
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
		"N": request.params.assetID + ""
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (!utils.isEmpty(data)) {
	    if (!!data.Item.UserID && data.Item.UserID.S == userID) {
		// The user must own either this Asset or its CraftedSpace.
		response.send(200, utils.parseItem(data.Item));
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
		    result.Assets[count++] = utils.parseItem(data.Items[i]);
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
		result.Assets[i] = utils.parseItem(data.Items[i]);
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
		"N": assetID + ""
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (!!data.Item.UserID && data.Item.UserID.S == userID) {
	    // The user must own this Asset in order to update it.
	    params = {
		"TableName": response.app.get("AssetTable"),
		"Key": {
		    "CSpaceID": {
			"S": cSpaceID
		    },
		    "AssetID": {
			"N": assetID + ""
		    }
		},
		"AttributeUpdates": {}
	    };
	    for (var attr in asset) {
		if (attr == "AssetID" || attr == "CSpaceID" ||
		    attr == "UserID") {
		    // These attributes shouldn't be changed here.
		    continue;
		} else if (attr == "image") {
		    var file = utils.parseBase64Data(asset[attr]);
		    if (file.isBase64) {
			var name = utils.generateKey(8);
			var key = s3.generateAssetKey(cSpaceID, assetID,
						      name, file.ext);
			s3.upload(file.body, key, "image/" + file.ext,
				  function(err, data) {
				      if (err) {
					  console.log(err);
				      }
				  });
			params.AttributeUpdates[attr] = {
			    "Value": {
				"S": s3.getAssetImageURL(cSpaceID,
						      assetID,
						      name,
						      file.ext)
			    },
			    "Action": "PUT"
			};
		    }
		} else {
		    if (!!asset[attr]) {
			params.AttributeUpdates[attr] = {
			    "Value": {
				"S": asset[attr]
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
		"N": assetID + ""
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
		    // Delete any images the asset may reference.
		    s3.deleteAssetImage(cSpaceID, assetID,
				     function(err, data) {
					 response.send(200, {message:
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
