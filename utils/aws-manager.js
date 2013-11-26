/**
 * A collection of AWS clients to simplify interactions with AWS services.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * A manager to simplify interactions with Amazon's S3 through their Node.js
 * SDK. 
 *
 * @constructor
 */
function S3(s3, bucket, adSpacePrefix, adPrefix) {
    // AWS-SDK S3 object for Node.js.
    this.s3 = s3;

    // The S3 bucket name.
    this.bucket = bucket;

    // The folder holding AdSpace images.
    this.adSpacePrefix = adSpacePrefix;

    // The folder holding Ad images.
    this.adPrefix = adPrefix;
}

/**
 * Upload an object to S3.
 * @param {Buffer} body The Buffer containing the file data.
 * @param {number} key.
 * @param {number} contentType.
 * @param {function(Object, Object)} callback.
 */
S3.prototype.upload = function(body, key, contentType, callback) {
    var params = {
	"ACL": "public-read",
	"Body": body,
	"Bucket": this.bucket,
	"Key": key,
	"ContentType": contentType
    };
    this.s3.putObject(params, callback);
};

/**
 * Deletes the image(s) for an AdSpace.
 * @param {number} adSpaceID.
 * @param {function(Object, Object)} callback.
 */
S3.prototype.deleteAdSpaceImage = function(adSpaceID, callback) {
    var params = {
	"Bucket": this.bucket,
	"Prefix": this.adSpacePrefix + "/" + adSpaceID + "/"
    };
    this.s3.listObjects(params, function(err, data) {
	if (err) {
	    callback(err, data);
	} else {
	    var keys = [];
	    for (var i = 0; i < data.Contents.length; i++) {
		keys[i] = {"Key": data.Contents[i].Key};
	    }
	    params =  {
		"Bucket": this.bucket,
		"Delete": {
		    "Objects": keys
		}
	    };
	    this.s3.deleteObjects(params, callback);
	}
    }.bind(this));
};

/**
 * Deletes the image(s) for an Ad.
 * @param {number} adSpaceID.
 * @param {number} adID.
 * @param {function(Object, Object)} callback.
 */
S3.prototype.deleteAdImage = function(adSpaceID, adID, callback) {
    var params = {
	"Bucket": this.bucket,
	"Prefix": this.adPrefix + "/" + adSpaceID + "/" + adID + "/"
    };
    this.s3.listObjects(params, function(err, data) {
	if (err) {
	    callback(err, data);
	} else if (data.Contents.length > 0) {
	    var keys = [];
	    for (var i = 0; i < data.Contents.length; i++) {
		keys[i] = {"Key": data.Contents[i].Key};
	    }
	    params =  {
		"Bucket": this.bucket,
		"Delete": {
		    "Objects": keys
		}
	    };
	    this.s3.deleteObjects(params, callback);
	} else {
	    // No data to delete.
	    callback(err, data);
	}
    }.bind(this));
};

/**
 * Returns the public URL for an AdSpace image.
 * @param {number} adSpaceID.
 * @param {string} name.
 * @param {string} ext.
 * @return {string} The url.
 */
S3.prototype.getAdSpaceImageURL = function(adSpaceID, name, ext) {
    return "https://" + this.bucket + ".s3.amazonaws.com/" +
	this.adSpacePrefix + "/" + adSpaceID + "/" + name + "." + ext;
};

/**
 * Returns the public URL for an Ad image.
 * @param {number} adSpaceID.
 * @param {number} adID.
 * @param {string} name.
 * @param {string} ext.
 * @return {string} The url.
 */
S3.prototype.getAdImageURL = function(adSpaceID, adID, name, ext) {
    return "https://" + this.bucket + ".s3.amazonaws.com/" + this.adPrefix +
	"/" + adSpaceID + "/" + adID + "/" + name + "." + ext;
};

/**
 * Constructs the key for an AdSpace image.
 * @param {number} adSpaceID.
 * @param {string} name.
 * @param {string} ext.
 * @return {string} The key.
 */
S3.prototype.generateAdSpaceKey = function(adSpaceID, name, ext) {
    return this.adSpacePrefix + "/" + adSpaceID + "/" + name + "." + ext;
};

/**
 * Constructs the key for an Ad image.
 * @param {number} adSpaceID.
 * @param {number} adID.
 * @param {string} name.
 * @param {string} ext.
 * @return {string} The key.
 */
S3.prototype.generateAdKey = function(adSpaceID, adID, name, ext) {
    return this.adPrefix + "/" + adSpaceID + "/" + adID + "/" + name +
	"." + ext;
};

exports.S3 = S3;
