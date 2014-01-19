/**
 * REST API Node.js server for AdCrafted.
 *
 * Currently, 3 environments are supported.
 *
 * LOCAL:
 *   Ensure that the (.gitignored) aws-credentials file exists at
 *   ./.local/credentials.json and contains the attributes accessKeyId and
 *   secreteAccessKey.
 *   Then, to start the server locally, enter these commands:
 *   $ export NODE_ENV=local
 *   $ node server.js
 *
 * DEVELOPMENT (live sandbox):
 *   Ensure that the environment variables are correct:
 *   NODE_ENV=development, and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are
 *   set.
 *
 * PRODUCTION:
 *   Ensure that the environment variables are correct:
 *   NODE_ENV=production, and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are
 *   set.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * Include modules here.
 */
var express = require("express")
  , config  = require("./../../config")
  , path    = require("path")
  , utils   = require("./../../utils/utils")
  , ads     = require("./../../routes/ads")
  , assets  = require("./../../routes/assets")
  , cspaces = require("./../../routes/craftedspaces");

/**
 * The Express application.
 */
var app = express();

/**
 * REST API environment-specific application configuration.
 */
app.configure("local", function() {
    console.log("Using local settings for REST API.");
    app.use(express.logger("dev"));
    app.set("S3Bucket", config.local.S3_BUCKET);
    app.set("CSpaceTable", config.local.CSPACE_TABLE_NAME);
    app.set("AdTable", config.local.AD_TABLE_NAME);
    app.set("AssetTable", config.local.ASSET_TABLE_NAME);
    app.set("UserTable", config.local.USER_TABLE_NAME);
    app.set("AdMetricsTable", config.local.AD_METRICS_TABLE_NAME);
    app.set("AssetMetricsTable", config.local.ASSET_METRICS_TABLE_NAME);
});
app.configure("development", function() {
    app.use(express.logger("dev"));
    app.set("S3Bucket", config.development.S3_BUCKET);
    app.set("CSpaceTable", config.development.CSPACE_TABLE_NAME);
    app.set("AdTable", config.development.AD_TABLE_NAME);
    app.set("AssetTable", config.development.ASSET_TABLE_NAME);
    app.set("UserTable", config.development.USER_TABLE_NAME);
    app.set("AdMetricsTable", config.development.AD_METRICS_TABLE_NAME);
    app.set("AssetMetricsTable", config.development.ASSET_METRICS_TABLE_NAME);
});
app.configure("production", function() {
    app.use(express.logger("tiny"));
    app.set("S3Bucket", config.production.S3_BUCKET);
    app.set("CSpaceTable", config.production.CSPACE_TABLE_NAME);
    app.set("AdTable", config.production.AD_TABLE_NAME);
    app.set("AssetTable", config.production.ASSET_TABLE_NAME);
    app.set("UserTable", config.production.USER_TABLE_NAME);
    app.set("AdMetricsTable", config.production.AD_METRICS_TABLE_NAME);
    app.set("AssetMetricsTable", config.production.ASSET_METRICS_TABLE_NAME);
});

/**
 * Allow Cross-Origin requests for GET and POST methods.
 */
var allowCrossOrigin = function(request, response, next) {
    response.header("Access-Control-Allow-Origin", config.ALLOW_ORIGINS);
    response.header("Access-Control-Allow-Methods", config.ALLOW_METHODS);
    response.header("Access-Control-Allow-Headers", config.ALLOW_HEADERS);
    // intercept the OPTIONS method and immediately return HTTP 200.
    if ("OPTIONS" == request.method) {
	response.send(200);
    } else {
	next();
    }
}

/**
 * General application configuration.
 */
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(allowCrossOrigin);
    app.use(app.router);
    app.use(express.compress());
    app.use(express.static(path.join(__dirname, "./public")));
    // Error handler.
    app.use(function(err, request, response, next){
	console.error(err.stack);
	response.send(500, {message: "An Error Occurred"});
    });
    // 404 handler.
    app.use(function(request, response, next){
	response.send(404, {message: "Resource Not Found"});
    });
});

/**
 * The Web API.
 */

// CREATE an asset in the specified CraftedSpace.
app.post("/v0/assets/:cSpaceID",
	 utils.setUserIDOnRequest(),
	 assets.createAsset);

// RETRIEVE all Assets within the specified CraftedSpace.
app.get("/v0/assets/:cSpaceID/all",
	utils.setUserIDOnRequest(),
	assets.getAllAssetsInCraftedSpace);

// RETRIEVE a single Asset.
app.get("/v0/assets/:cSpaceID/:assetID",
	utils.setUserIDOnRequest(),
	assets.getAsset);

// UPDATE an asset.
app.put("/v0/assets/:cSpaceID/:assetID",
	utils.setUserIDOnRequest(),
	assets.updateAsset);

// UPDATE an asset (for clients that don't support HTTP PUT).
app.post("/v0/assets/:cSpaceID/:assetID/update_post",
	utils.setUserIDOnRequest(),
	assets.updateAsset);

// DELETE an asset without deleting the CraftedSpace.
app.del("/v0/assets/:cSpaceID/:assetID",
	utils.setUserIDOnRequest(),
	assets.deleteAsset);

// UPLOAD a file to an asset (POST).
app.post("/v0/assets/:cSpaceID/:assetID/upload_file/:attrName",
	utils.setUserIDOnRequest(),
	 assets.upload("FILE"));

// UPLOAD an image to an asset (POST).
app.post("/v0/assets/:cSpaceID/:assetID/upload_image/:attrName",
	utils.setUserIDOnRequest(),
	 assets.upload("IMAGE"));

// UPLOAD a file to an asset (PUT).
app.put("/v0/assets/:cSpaceID/:assetID/upload_file/:attrName",
	utils.setUserIDOnRequest(),
	assets.upload("FILE"));

// UPLOAD an image to an asset (PUT).
app.put("/v0/assets/:cSpaceID/:assetID/upload_image/:attrName",
	utils.setUserIDOnRequest(),
	assets.upload("IMAGE"));

exports.app = app;
