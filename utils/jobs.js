/**
 * A job to update the metrics on an ad.
 *
 * Author: James Pasko (james@adcrafted.com).
 *
 * @constructor
 */
function UpdateMetricsJob(db, tableName, adSpaceID, adID, impressions, clicks) {
    // The DynamoDB client from the AWS-SDK.
    this.db = db;

    // The parameters used to query the ad.
    this.params = {
	"TableName": tableName,
	"Key": {
	    "AdSpaceID": {
		"S": adSpaceID
	    },
	    "AdID" : {
		"N": adID + ""
	    }
	}
    };

    // The number of impressions to register.
    this.impressions = impressions;

    // The number of clicks to register.
    this.clicks = clicks;
}

/**
 * Run the job.
 */
UpdateMetricsJob.prototype.run = function() {
    this.db.getItem(this.params, function(err, data) {
	if (err) {
	    console.log(err);
	} else if (!UpdateMetricsJob._isEmpty(data)) {
	    var impressions = data.Item.impressions ?
		parseInt(data.Item.impressions.N) : 0;
	    var clicks = data.Item.clicks ?
		parseInt(data.Item.clicks.N) : 0;
	    this.params["AttributeUpdates"] = {
		"impressions": {
		    "Value": {
			"N": impressions + this.impressions + ""
		    },
		    "Action": "PUT"
		},
		"clicks" :{
		    "Value": {
			"N": clicks + this.clicks + ""
		    },
		    "Action": "PUT"
		}
	    };
	    this.db.updateItem(this.params, function(err, data) {
		if (err) {
		    console.log(err);
		}
	    }.bind(this));
	}
    }.bind(this));
};

exports.UpdateMetricsJob = UpdateMetricsJob;

/**
 * Checks if the object is empty (has no properties of its own).
 */
UpdateMetricsJob._isEmpty = function(o){
    for(var i in o){
        if(o.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
};
