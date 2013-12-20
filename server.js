/**
 * Master Node.js server for AdCrafted management application and web service.
 *
 * Currently, 3 environments are supported. One is a local ennvironment, one is
 * a live development sandbox, and one is the production environment.
 *
 * LOCAL:
 *   Ensure that the (.gitignored) aws-credentials file exists at
 *   ./.local/credentials.json and contains the attributes accessKeyId and
 *   secreteAccessKey.
 *
 *   Ensure that the (.gitignored) google-credentials file exists at
 *   ./.local/google-credentials.json and contains the attributes clientID and
 *   clientSecret.
 *
 *   Ensure that Redis is installed and running locally:
 *   INSTALL:
 *   $ wget http://download.redis.io/releases/redis-2.6.16.tar.gz
 *   $ tar xzf redis-2.6.16.tar.gz
 *   $ cd redis-2.6.16
 *   $ make
 *   RUN:
 *   $ ~/redis-2.6.16/src/redis-server
 *
 *   Then, to start the server locally, enter these commands:
 *   $ export NODE_ENV=local
 *   $ node server.js
 *
 *   Debugging:
 *   $ npm install -g node-inspector (IF NOT INSTALLED)
 *   $ node --debug server.js
 *   $ node-inspector &
 *   open http://127.0.0.1:8080/debug?port=5858 in Chrome
 *
 * DEVELOPMENT:
 *   Ensure that the environment variables are correct:
 *   NODE_ENV=development, and AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 *   GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET are set.
 *
 * PRODUCTION:
 *   Ensure that the environment variables are correct:
 *   NODE_ENV=production, and AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 *   GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET are set.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * Include modules here.
 */
var express    = require("express")
  , config     = require("./config")
  , AWS        = require("aws-sdk")
  , website    = require("./routes/website")
  , landing    = require("./routes/landing")
  , AWSManager = require("./utils/aws-manager")
  , scheduler  = require("./utils/job-scheduler")
  , path       = require("path")
  , api        = require("./apps/api/api")
  , accounts   = require("./apps/accounts/accounts")
  , developer  = require("./apps/developer/developer");

/**
 * Express application.
 */
var app = express();

/**
 * Environment-specific Express application configuration.
 */
app.configure("local", function() {
    console.log("Using local settings for Default Application.");
    app.use(express.logger("dev"));
    // AWS configuration and AWS-related settings.
    AWS.config.loadFromPath("./.local/aws-credentials.json");
    // Subdomains for the API and the management application.
    app.use(express.vhost("api.test.com", api.app));
    app.use(express.vhost("accounts.test.com", accounts.app));
    app.use(express.vhost("developer.test.com", developer.app));
    // Set up static files.
    app.use(express.static(path.join(__dirname, config.local.STATIC_PATH)));
    // Set the domain.
    app.set("DOMAIN", config.local.DOMAIN);
});
app.configure("development", function() {
    console.log("Using development settings.");
    app.use(express.logger("dev"));
    // AWS configuration and AWS-related settings.
    AWS.config.update({region: 'us-east-1'});
    // Subdomains for the API and the management application.
    app.use(express.vhost("api.citreo.us", api.app));
    app.use(express.vhost("accounts.citreo.us", accounts.app));
    app.use(express.vhost("developer.citreo.us", developer.app));
    // Set up static files.
    app.use(
	express.static(path.join(__dirname, config.development.STATIC_PATH)));
    // Set the domain.
    app.set("DOMAIN", config.development.DOMAIN);
});
app.configure("production", function() {
    console.log("Using production settings.");
    app.use(express.logger("tiny"));
    // AWS configuration and AWS-related settings.
    AWS.config.update({region: 'us-east-1'});
    // Subdomains for the API and the management application.
    app.use(express.vhost("api.appcrafted.com", api.app));
    app.use(express.vhost("accounts.appcrafted.com", accounts.app));
    app.use(express.vhost("developer.appcrafted.com", developer.app));
    // Set up static files.
    app.use(
	express.static(path.join(__dirname, config.production.STATIC_PATH)));
    // Set the domain.
    app.set("DOMAIN", config.production.DOMAIN);
});

/**
 * General Express application configuration.
 */
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.favicon());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.compress());
    app.set("views", path.join(__dirname, config.VIEWS_PATH));
    app.set("view engine", config.VIEW_ENGINE);
    // Create a DynamoDB management instance and share among the applications.
    var db = new AWS.DynamoDB();
    app.set("db", db);
    api.app.set("db", db);
    accounts.app.set("db", db);
    developer.app.set("db", db);
    // Create an S3 management instance and share among the applications.
    var s3_SDK = new AWS.S3();
    switch (process.env.NODE_ENV) {
    case "production":
	var endpoint = config.production.CDN_ENDPOINT;
	break;
    case "development":
	var endpoint = config.development.CDN_ENDPOINT;
	break;
    case "local":
	var endpoint = config.local.CDN_ENDPOINT;
	break;
    default:
	var endpoint = null;
    }
    api.app.set("s3", new AWSManager.S3(s3_SDK, api.app.get("S3Bucket"),
					config.CSPACE_FILE_PREFIX,
					config.AD_FILE_PREFIX,
					config.ASSET_FILE_PREFIX, endpoint));
    developer.app.set(
	"s3", new AWSManager.S3(s3_SDK, developer.app.get("S3Bucket"),
				config.CSPACE_FILE_PREFIX,
				config.AD_FILE_PREFIX,
				config.ASSET_FILE_PREFIX, endpoint));
    // Create an SES service interface object.
    var ses = new AWS.SES();
    app.set("ses", ses);
    // Create and start a shared job scheduler (interval in milliseconds).
    var jobScheduler = new scheduler.JobScheduler(100);
    jobScheduler.start();
    api.app.set("jobScheduler", jobScheduler);
    accounts.app.set("jobScheduler", jobScheduler);
    developer.app.set("jobScheduler", jobScheduler);
    // Error handler.
    app.use(function(err, request, response, next){
	console.error(err.stack);
	response.status(500).render("500");
    });
    // 404 handler.
    app.use(function(request, response, next){
	response.status(404).render("404");
    });
});

/**
 * Initialize the Express application.
 */
function init() {
    // Render the landing page.
    app.get("/", website.index);

    // Collect an email.
    app.post("/email", landing.collectEmail);

    app.listen(process.env.PORT || 8888);
}

init();
