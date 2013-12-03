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
 * Create a new Ad within the specified AdSpace.
 */
exports.createAd = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var ad = request.body;
    var newAdID = 0;
    var adSpaceID = request.params.adspace_id;
    // Scan the table for the AdSpace since we don't know its UserID.
    var params = {
	"TableName": request.app.get("adspace_table_name"),
	"ScanFilter": {
            "AdSpaceID": {
		"AttributeValueList": [
                    {
			"S": adSpaceID
                    }
		],
		"ComparisonOperator": "EQ"
            }
	}
    };
    // Check if the AdSpace exists by scanning the table.
    db.scan(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (data.Count == 0) {
	    response.send(400, {message: "AdSpace Does Not Exist"});
	} else {
	    // There should only be a single AdSpace matching the ScanFilter.
	    var adSpaceUserID = data.Items[0].UserID ?
		data.Items[0].UserID.S : null;
	    if (!adSpaceUserID) {
		// Terminate processing the request if the AdSpace has no owner.
		response.send(500, {message: "An Error Occurred"});
	    }
	    params = {
		"TableName": response.app.get("ads_table_name"),
		"KeyConditions": {
		    "AdSpaceID": {
			"ComparisonOperator" : "EQ",
			"AttributeValueList" : [
			    {"S": adSpaceID}
			]
		    }
		}
	    };
	    // Query to determine how many Ads this AdSpace contains, and
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
			"TableName": response.app.get("ads_table_name"),
			"Item": {
			    "AdSpaceID": {
				"S": adSpaceID
			    },
			    "AdID": {
				"N": newAdID + ""
			    },
			    "UserID" : {
				"S": userID
			    },
			    "AdSpaceUserID": {
				"S": adSpaceUserID
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
			// The image attribute is a Base64 encoded file and must
			// be processed separately.
			if (attr == "image" && !!ad["image"]) {
			    var file = utils.parseBase64Data(ad[attr]);
			    if (file.isBase64) {
				var name = utils.generateKey(8);
				var key = s3.generateAdKey(adSpaceID, newAdID,
							   name, file.ext);
				s3.upload(file.body, key, "image/" + file.ext,
					  function(err, data) {
					      if (err) {
						  console.log(err);
					      }
					  });
				params.Item["image"] = {
				    "S": s3.getAdImageURL(adSpaceID, newAdID,
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
						AdSpaceID: adSpaceID,
						AdID: newAdID});
			}
		    });
		}
	    });
	}
    });
};

/**
 * Get a single Ad specified by the AdID and AdSpaceID.
 */
exports.getAd = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("ads_table_name"),
	"Key": {
	    "AdSpaceID": {
		"S": request.params.adspace_id
	    },
	    "AdID" : {
		"N": request.params.ad_id + ""
	    }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(500, {message: "An Error Occurred"});
	} else if (!utils.isEmpty(data)) {
	    if ((!!data.Item.AdSpaceUserID &&
		 data.Item.AdSpaceUserID.S == userID) ||
		(!!data.Item.UserID && data.Item.UserID.S == userID)) {
		// The user must own either this Ad or its AdSpace.
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
	"TableName": response.app.get("ads_table_name")
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
 * Get all ads in the specified AdSpace.
 */
exports.getAllAdsInAdSpace = function(request, response) {
    var adSpaceUserID = request.user.id;
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("ads_table_name"),
	"IndexName": config.ADSPACE_USER_ID_INDEX,
	"KeyConditions": {
	    "AdSpaceID": {
		"ComparisonOperator" : "EQ",
		"AttributeValueList" : [
		    {"S": request.params.adspace_id}
		]
	    },
	    "AdSpaceUserID": {
		"ComparisonOperator" : "EQ",
		"AttributeValueList" : [
		    {"S": adSpaceUserID}
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
    var adSpaceID = request.params.adspace_id;
    var adID = request.params.ad_id;
    var params = {
	"TableName": response.app.get("ads_table_name"),
	"Key": {
	    "AdSpaceID": {
		"S": adSpaceID
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
		"TableName": response.app.get("ads_table_name"),
		"Key": {
		    "AdSpaceID": {
			"S": adSpaceID
		    },
		    "AdID": {
			"N": adID + ""
		    }
		},
		"AttributeUpdates": {}
	    };
	    for (var attr in ad) {
		if (attr == "AdID" || attr == "AdSpaceID" ||
		    attr == "UserID" || attr == "AdSpaceUserID" ||
		    attr == "impressions" || attr == "clicks") {
		    // These attributes shouldn't be changed here.
		    continue;
		} else if (attr == "image") {
		    var file = utils.parseBase64Data(ad[attr]);
		    if (file.isBase64) {
			var name = utils.generateKey(8);
			var key =
			    s3.generateAdKey(adSpaceID, adID, name, file.ext);
			s3.upload(file.body, key, "image/" + file.ext,
				  function(err, data) {
				      if (err) {
					  console.log(err);
				      }
				  });
			params.AttributeUpdates[attr] = {
			    "Value": {
				"S": s3.getAdImageURL(adSpaceID,
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
 * Deletes the specified Ad if it exists without deleting the AdSpace.
 */
exports.deleteAd = function(request, response) {
    var userID = request.user.id;
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var adSpaceID = request.params.adspace_id;
    var adID = request.params.ad_id;
    var params = {
	"TableName": response.app.get("ads_table_name"),
	"Key": {
	    "AdSpaceID": {
		"S": adSpaceID
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
		    s3.deleteAdImage(adSpaceID, adID,
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
    var id = request.params.adspace_id + request.params.ad_id;
    var params = {
	"TableName": response.app.get("metrics_table_name"),
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
				response.app.get("metrics_table_name"),
				request.params.adspace_id,
				request.params.ad_id,
				impressions,
				clicks);
	jobScheduler.add(metricsJob);
	response.send(200, {message: "Metrics Updated"});
    } else {
	response.send(400, {message: "Invalid Request Body"});
    }
};
