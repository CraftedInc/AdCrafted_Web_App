/**
 * Functions for Creating, Reading, Updating, and Deleting Ads.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

// A set of jobs that can be scheduled using the job scheduler.
var jobs = require("../utils/jobs");

// A set of utility functions.
var utils = require("../utils/utils");

// UUIDs are used to name image files.
var uuid = require("node-uuid");

/**
 * Create a new Ad within the specified AdSpace.
 */
exports.createAd = function(request, response) {
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var ad = request.body;
    var newAdID = 0;
    var adSpaceID = request.params.adspace_id;
    var params = utils.adSpaceParams(response.app.get("adspace_table_name"),
				     adSpaceID);
    // Check if the AdSpace exists.
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else if (utils.isEmpty(data)) {
	    response.send( {"status": 400,
			    "message": "AdSpace does not exist"} );
	} else {
	    params = {
		"TableName": response.app.get("ads_table_name"),
		"KeyConditions": {
		    "AdSpaceID": {
			"AttributeValueList" : [{
			    "S": adSpaceID
			}],
			"ComparisonOperator" : "EQ"
		    }
		}
	    };
	    // Query to determine how many ads this AdSpace contains, and
	    // select an appropriate AdID.
	    db.query(params, function(err, data) {
		if (err) {
		    response.send(err);
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
				var name = uuid.v4();
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
			    response.send(err);
			} else {
			    response.send( {"status": 201,
					    "message": "Success",
					    "AdSpaceID": adSpaceID,
					    "AdID": newAdID} );
			}
		    });
		}
	    });
	}
    });
};

/**
 * Get a single Ad within the specified AdSpace.
 */
exports.getAd = function(request, response) {
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
	    response.send(err);
	} else if (!utils.isEmpty(data)) {
	    response.send(utils.parseItem(data.Item));
	} else {
	    response.send({"status": 404,
			   "message": "No such ad"});
	}
    });
};

/**
 * Get all ads in the specified AdSpace.
 */
exports.getAllAds = function(request, response) {
    var db = response.app.get("db");
    var params = {
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
	} else {
	    var result = {"Count": data.Count,
			  "Ads": []};
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
	    "AdID": {
		"N": adID + ""
	    }
	},
	"AttributeUpdates": {}
    };
    for (var attr in ad) {
	if (attr == "AdID" || attr == "AdSpaceID" ||
	    attr == "impressions" || attr == "clicks") {
	    continue;
	} else if (attr == "image") {
	    var file = utils.parseBase64Data(ad[attr]);
	    if (file.isBase64) {
		var name = uuid.v4();
		var key = s3.generateAdKey(adSpaceID, adID, name, file.ext);
		s3.upload(file.body, key, "image/" + file.ext,
			  function(err, data) {
			      if (err) {
				  console.log(err);
			      }
			  });
		params.AttributeUpdates[attr] = {
		    "Value": {
			"S": s3.getAdImageURL(adSpaceID, adID, name, file.ext)
		    },
		    "Action": "PUT"
		};
	    }
	} else {
	    params.AttributeUpdates[attr] = {
		"Value": {
		    "S": ad[attr]
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
 * Deletes the specified Ad if it exists without deleting the AdSpace.
 */
exports.deleteAd = function(request, response) {
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var params = {
	"TableName": response.app.get("ads_table_name"),
	"Key": {
	    "AdSpaceID": {
		"S": request.params.adspace_id
	    },
	    "AdID": {
		"N": request.params.ad_id + ""
	    }
	}
    };
    // Remove the item from the database.
    db.deleteItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    // Finally, delete any images the ad may reference.
	    s3.deleteAdImage(request.params.adspace_id, request.params.ad_id,
			     function(err, data) {
				 if (err) {
				     response.send( {"status": 500,
						     "message": "Error"} );
				 } else {
				     response.send( {"status": 200,
						     "message": "Success"} );
				 }
			     });
	}
    });
};

/**
 * Returns the metrics for the ad.
 */
exports.getMetrics = function(request, response) {
    var db = response.app.get("db");
    var id = request.params.adspace_id + request.params.ad_id;
    var params = {
	"TableName": response.app.get("metrics_table_name"),
	"KeyConditions": {
	    "ID": {
		"AttributeValueList" : [{
		    "S": id
		}],
		"ComparisonOperator" : "EQ"
	    }
	}
    };
    db.query(params, function(err, data) {
	if (err) {
	    response.send(err);
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
	response.send( {"status": 200,
			"message": "Success"} );
    } else {
	response.send( {"status": 400,
			"message": "Invalid request body"} );
    }
};
