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
var express  = require("express")
  , config   = require("./../../config")
  , path     = require("path")
  , utils    = require("./../../utils/utils")
  , ads      = require("./../../routes/ads")
  , adspaces = require("./../../routes/adspaces");

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
    app.set("s3_bucket", config.local.S3_BUCKET);
    app.set("adspace_table_name", config.local.ADSPACE_TABLE_NAME);
    app.set("ads_table_name", config.local.AD_TABLE_NAME);
    app.set("user_table_name", config.local.USER_TABLE_NAME);
    app.set("metrics_table_name", config.local.METRICS_TABLE_NAME);
});
app.configure("development", function() {
    app.use(express.logger("dev"));
    app.set("s3_bucket", config.development.S3_BUCKET);
    app.set("adspace_table_name", config.development.ADSPACE_TABLE_NAME);
    app.set("ads_table_name", config.development.AD_TABLE_NAME);
    app.set("user_table_name", config.development.USER_TABLE_NAME);
    app.set("metrics_table_name", config.development.METRICS_TABLE_NAME);
});
app.configure("production", function() {
    app.use(express.logger("tiny"));
    app.set("s3_bucket", config.production.S3_BUCKET);
    app.set("adspace_table_name", config.production.ADSPACE_TABLE_NAME);
    app.set("ads_table_name", config.production.AD_TABLE_NAME);
    app.set("user_table_name", config.production.USER_TABLE_NAME);
    app.set("metrics_table_name", config.production.METRICS_TABLE_NAME);
});

/**
 * General application configuration.
 */
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
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
 * The API, secured using an access key and signature combination.
 */

// RETRIEVE all ads within the specified AdSpace.
app.get("/adspace/:adspace_id/ad", ads.getAllAds);

// UPDATE the impression and click metrics.
app.post("/adspace/:adspace_id/ad/:ad_id/metrics", ads.updateMetrics);

exports.app = app;
