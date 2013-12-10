/**
 * Functions for Creating, Reading, Updating, and Deleting Ads.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

// A set of jobs that can be scheduled using the job scheduler.
var jobs = require("../utils/jobs");

// A set of utility functions.
var utils = require("../utils/utils");

// Configuration.
var config = require("../config");

/**
 * Create a new Ad within the specified CraftedSpace.
 */
exports.createAd = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var ad = request.body;
    var newAdID = 0;
    var cSpaceID = request.params.cSpaceID;
    // Scan the table for the CraftedSpace since we don't know its UserID.
    var params = {
	"TableName": request.app.get("CSpaceTable"),
	"ScanFilter": {
            "CSpaceID": {
		"AttributeValueList": [
                    {
			"S": cSpaceID
                    }
		],
		"ComparisonOperator": "EQ"
            }
	}
    };
    // Check if the CraftedSpace exists by scanning the table.
    db.scan(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (data.Count == 0) {
	    response.send(400, {message: "CraftedSpace Does Not Exist"});
	} else {
	    // There should only be a single CraftedSpace matching the ScanFilter.
	    var cSpaceUserID = data.Items[0].UserID ?
		data.Items[0].UserID.S : null;
	    if (!cSpaceUserID) {
		// Terminate processing the request if the CraftedSpace has no owner.
		response.send(500, {message: "An Error Occurred"});
	    }
	    params = {
		"TableName": response.app.get("AdTable"),
		"KeyConditions": {
		    "CSpaceID": {
			"ComparisonOperator" : "EQ",
			"AttributeValueList" : [
			    {"S": cSpaceID}
			]
		    }
		}
	    };
	    // Query to determine how many Ads this CraftedSpace contains, and
	    // select an appropriate AdID.
	    db.query(params, function(err, data) {
		if (err) {
		    response.send(500, {message: "An Error Occurred"});
		} else {
		    if (data.Count > 0) {
			for (var i = 0; i < data.Count; i++) {
			    if (data.Items[i].AdID.N > newAdID) {
				newAdID = data.Items[i].AdID.N;
			    }
			}
			newAdID++;
		    }
		    params = {
			"TableName": response.app.get("AdTable"),
			"Item": {
			    "CSpaceID": {
				"S": cSpaceID
			    },
			    "AdID": {
				"N": newAdID + ""
			    },
			    "UserID" : {
				"S": userID
			    },
			    "CSpaceUserID": {
				"S": cSpaceUserID
			    },
			    "image": {
				"S": "null"
			    },
			    "date": {
				"S": new Date().toISOString()
			    },
			    "impressions": {
				"N": 0 + ""
			    },
			    "clicks": {
				"N": 0 + ""
			    }
			}
		    };
		    for (var attr in ad) {
			// Skip over items containing an empty string.
			if (ad[attr] == "") {
			    continue;
			}
			// The image attribute is a Base64 encoded file and must
			// be processed separately.
			if (attr == "image" && !!ad["image"]) {
			    var file = utils.parseBase64Data(ad[attr]);
			    if (file.isBase64) {
				var name = utils.generateKey(8);
				var key = s3.generateAdKey(cSpaceID, newAdID,
							   name, file.ext);
				s3.upload(file.body, key, "image/" + file.ext,
					  function(err, data) {
					      if (err) {
						  console.log(err);
					      }
					  });
				params.Item["image"] = {
				    "S": s3.getAdImageURL(cSpaceID, newAdID,
							  name, file.ext)
				};
			    }
			} else if (ad[attr] instanceof Array) {
			    params.Item[attr] = {"SS": ad[attr]};
			} else {
			    params.Item[attr] = {"S": ad[attr]};
			}
		    }
		    // Finally, put the new ad.
		    db.putItem(params, function(err, data) {
			if (err) {
			    response.send(500, {message: "An Error Occurred"});
			} else {
			    response.send(201, {message: "New Ad Created",
						CSpaceID: cSpaceID,
						AdID: newAdID});
			}
		    });
		}
	    });
	}
    });
};

/**
 * Get a single Ad specified by the AdID and CSpaceID.
 */
exports.getAd = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("AdTable"),
	"Key": {
	    "CSpaceID": {
		"S": request.params.cSpaceID
	    },
	    "AdID" : {
		"N": request.params.adID + ""
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (!utils.isEmpty(data)) {
	    if ((!!data.Item.CSpaceUserID &&
		 data.Item.CSpaceUserID.S == userID) ||
		(!!data.Item.UserID && data.Item.UserID.S == userID)) {
		// The user must own either this Ad or its CraftedSpace.
		response.send(200, utils.parseItem(data.Item));
	    } else {
		response.send(403, {message: "Not Authorized"});
	    }
	} else {
	    response.send(404, {message: "No Such Ad"});
	}
    });
};

/**
 * Gets all Ads belonging to the specified user.
 */
exports.getAllUserAds = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("AdTable")
    };
    db.scan(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else {
	    var count = 0;
	    var result = {message: "Success",
			  Ads: []};
	    for (var i = 0; i < data.Count; i++) {
		if (!!data.Item.UserID && data.Item.UserID.S == userID) {
		    result.Ads[count++] = utils.parseItem(data.Items[i]);
		}
	    }
	    result.Count = count;
	    response.send(result);
	}
    });
};

/**
 * Get all ads in the specified CraftedSpace.
 */
exports.getAllAdsInCraftedSpace = function(request, response) {
    var cSpaceUserID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("AdTable"),
	"IndexName": config.CSPACE_USER_ID_INDEX,
	"KeyConditions": {
	    "CSpaceID": {
		"ComparisonOperator" : "EQ",
		"AttributeValueList" : [
		    {"S": request.params.cSpaceID}
		]
	    },
	    "CSpaceUserID": {
		"ComparisonOperator" : "EQ",
		"AttributeValueList" : [
		    {"S": cSpaceUserID}
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
			  Ads: []};
	    for (var i = 0; i < data.Count; i++) {
		result.Ads[i] = utils.parseItem(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

/**
 * Updates the specified ad. If it doesn't exist, a new ad is created.
 */
exports.updateAd = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var ad = request.body;
    var cSpaceID = request.params.cSpaceID;
    var adID = request.params.adID;
    var params = {
	"TableName": response.app.get("AdTable"),
	"Key": {
	    "CSpaceID": {
		"S": cSpaceID
	    },
	    "AdID" : {
		"N": adID + ""
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (!!data.Item.UserID && data.Item.UserID.S == userID) {
	    // The user must own this Ad in order to update it.
	    params = {
		"TableName": response.app.get("AdTable"),
		"Key": {
		    "CSpaceID": {
			"S": cSpaceID
		    },
		    "AdID": {
			"N": adID + ""
		    }
		},
		"AttributeUpdates": {}
	    };
	    for (var attr in ad) {
		if (attr == "AdID" || attr == "CSpaceID" ||
		    attr == "UserID" || attr == "CSpaceUserID" ||
		    attr == "impressions" || attr == "clicks") {
		    // These attributes shouldn't be changed here.
		    continue;
		} else if (attr == "image") {
		    var file = utils.parseBase64Data(ad[attr]);
		    if (file.isBase64) {
			var name = utils.generateKey(8);
			var key =
			    s3.generateAdKey(cSpaceID, adID, name, file.ext);
			s3.upload(file.body, key, "image/" + file.ext,
				  function(err, data) {
				      if (err) {
					  console.log(err);
				      }
				  });
			params.AttributeUpdates[attr] = {
			    "Value": {
				"S": s3.getAdImageURL(cSpaceID,
						      adID,
						      name,
						      file.ext)
			    },
			    "Action": "PUT"
			};
		    }
		} else {
		    if (!!ad[attr]) {
			params.AttributeUpdates[attr] = {
			    "Value": {
				"S": ad[attr]
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
		    response.send(200, {message: "Ad Updated"});
		}
	    });
	} else {
	    response.send(403, {message: "Not Authorized"});
	}
    });
};

/**
 * Deletes the specified Ad if it exists without deleting the CraftedSpace.
 */
exports.deleteAd = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var cSpaceID = request.params.cSpaceID;
    var adID = request.params.adID;
    var params = {
	"TableName": response.app.get("AdTable"),
	"Key": {
	    "CSpaceID": {
		"S": cSpaceID
	    },
	    "AdID" : {
		"N": adID + ""
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (!!data.Item.UserID && data.Item.UserID.S == userID) {
	    // The user must own this Ad in order to delete it.
	    db.deleteItem(params, function(err, data) {
		if (err) {
		    response.send(500, {message: "An Error Occurred"});
		} else {
		    // Delete any images the ad may reference.
		    s3.deleteAdImage(cSpaceID, adID,
				     function(err, data) {
					 response.send(200, {message:
							     "Ad Deleted"});
				     });
		}
	    });
	} else {
	    response.send(403, {message: "Not Authorized"});
	}
    });
};

/**
 * Returns the metrics for the ad.
 */
exports.getMetrics = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var id = request.params.cSpaceID + request.params.adID;
    var params = {
	"TableName": response.app.get("AdMetricsTable"),
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
				response.app.get("AdMetricsTable"),
				request.params.cSpaceID,
				request.params.adID,
				impressions,
				clicks);
	jobScheduler.add(metricsJob);
	response.send(200, {message: "Metrics Updated"});
    } else {
	response.send(400, {message: "Invalid Request Body"});
    }
};
