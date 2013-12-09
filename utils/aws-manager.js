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
function S3(s3, bucket, cSpacePrefix, adPrefix, assetPrefix) {
    // AWS-SDK S3 object for Node.js.
    this.s3 = s3;

    // The S3 bucket name.
    this.bucket = bucket;

    // The folder holding CraftedSpace images.
    this.cSpacePrefix = cSpacePrefix;

    // The folder holding Ad images.
    this.adPrefix = adPrefix;

    // The folder holding Asset images.
    this.assetPrefix = assetPrefix;
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
 * Deletes the image(s) for an CraftedSpace.
 * @param {number} cSpaceID.
 * @param {function(Object, Object)} callback.
 */
S3.prototype.deleteCraftedSpaceImage = function(cSpaceID, callback) {
    var prefix = this.cSpacePrefix + "/" + cSpaceID + "/";
    this._deleteFolder(prefix, callback);
};

/**
 * Deletes the image(s) for an Ad.
 * @param {number} cSpaceID.
 * @param {number} adID.
 * @param {function(Object, Object)} callback.
 */
S3.prototype.deleteAdImage = function(cSpaceID, adID, callback) {
    var prefix = this.adPrefix + "/" + cSpaceID + "/" + adID + "/";
    this._deleteFolder(prefix, callback);
};

/**
 * Deletes the image(s) for an Asset.
 * @param {number} cSpaceID.
 * @param {number} assetID.
 * @param {function(Object, Object)} callback.
 */
S3.prototype.deleteAssetImage = function(cSpaceID, assetID, callback) {
    var prefix = this.assetPrefix + "/" + cSpaceID + "/" + assetID + "/";
    this._deleteFolder(prefix, callback);
};

/**
 * Returns the public URL for an CraftedSpace image.
 * @param {number} cSpaceID.
 * @param {string} name.
 * @param {string} ext.
 * @return {string} The url.
 */
S3.prototype.getCraftedSpaceImageURL = function(cSpaceID, name, ext) {
    return "https://" + this.bucket + ".s3.amazonaws.com/" +
	this.cSpacePrefix + "/" + cSpaceID + "/" + name + "." + ext;
};

/**
 * Returns the public URL for an Ad image.
 * @param {number} cSpaceID.
 * @param {number} adID.
 * @param {string} name.
 * @param {string} ext.
 * @return {string} The url.
 */
S3.prototype.getAdImageURL = function(cSpaceID, adID, name, ext) {
    return "https://" + this.bucket + ".s3.amazonaws.com/" + this.adPrefix +
	"/" + cSpaceID + "/" + adID + "/" + name + "." + ext;
};

/**
 * Returns the public URL for an Ad image.
 * @param {number} cSpaceID.
 * @param {number} assetID.
 * @param {string} name.
 * @param {string} ext.
 * @return {string} The url.
 */
S3.prototype.getAssetImageURL = function(cSpaceID, assetID, name, ext) {
    return "https://" + this.bucket + ".s3.amazonaws.com/" + this.assetPrefix +
	"/" + cSpaceID + "/" + assetID + "/" + name + "." + ext;
};

/**
 * Constructs the key for an CraftedSpace image.
 * @param {number} cSpaceID.
 * @param {string} name.
 * @param {string} ext.
 * @return {string} The key.
 */
S3.prototype.generateCraftedSpaceKey = function(cSpaceID, name, ext) {
    return this.cSpacePrefix + "/" + cSpaceID + "/" + name + "." + ext;
};

/**
 * Constructs the key for an Ad image.
 * @param {number} cSpaceID.
 * @param {number} adID.
 * @param {string} name.
 * @param {string} ext.
 * @return {string} The key.
 */
S3.prototype.generateAdKey = function(cSpaceID, adID, name, ext) {
    return this.adPrefix + "/" + cSpaceID + "/" + adID + "/" + name +
	"." + ext;
};

/**
 * Constructs the key for an Asset image.
 * @param {number} cSpaceID.
 * @param {number} assetID.
 * @param {string} name.
 * @param {string} ext.
 * @return {string} The key.
 */
S3.prototype.generateAssetKey = function(cSpaceID, assetID, name, ext) {
    return this.assetPrefix + "/" + cSpaceID + "/" + assetID + "/" + name +
	"." + ext;
};

/**
 * Private helper function to delete the contents of a folder.
 * @param {string} prefix.
 * @param {function(Object, Object)} callback.
 */
S3.prototype._deleteFolder = function(prefix, callback) {
    var params = {
	"Bucket": this.bucket,
	"Prefix": prefix
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
 * Private helper function to upload an object to S3.
 * @param {Buffer} body The Buffer containing the file data.
 * @param {number} key.
 * @param {number} contentType.
 * @param {function(Object, Object)} callback.
 */
S3.prototype._upload = function(body, key, contentType, callback) {
    var params = {
	"ACL": "public-read",
	"Body": body,
	"Bucket": this.bucket,
	"Key": key,
	"ContentType": contentType
    };
    this.s3.putObject(params, callback);
};

exports.S3 = S3;
