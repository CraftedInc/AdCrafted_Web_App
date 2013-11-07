/**
 * A job to register impressions and clicks for a particular ad.
 *
 * Author: James Pasko (james@adcrafted.com).
 *
 * @constructor
 */
function MetricsJob(db, metricsTable, adSpaceID, adID, impressions, clicks) {
    // The DynamoDB client from the AWS-SDK.
    this.db = db;

    // Figure out what the current date is in YYYY-MM-DD format.
    var date = new Date();
    this.today = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +
	date.getDate();

    // The parameters used to query the ad.
    this.params = {
	"TableName": metricsTable,
	"Key": {
	    "ID": {
		"S": "" + adSpaceID + adID
	    },
	    "Date" : {
		"S": this.today
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
MetricsJob.prototype.run = function() {
    this.db.getItem(this.params, function(err, data) {
	if (err) {
	    console.log(err);
	} else {
	    var impressions = 0;
	    var clicks = 0;
	    if (!_isEmpty(data)) {
		var impressions = data.Item.impressions ?
		    parseInt(data.Item.impressions.N) : 0;
		var clicks = data.Item.clicks ?
		    parseInt(data.Item.clicks.N) : 0;
	    }
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

exports.MetricsJob = MetricsJob;

/**
 * Checks if the object is empty (has no properties of its own).
 */
var _isEmpty = function(o) {
    for(var i in o){
        if(o.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
};
