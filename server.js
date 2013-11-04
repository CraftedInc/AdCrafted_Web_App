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
  , advertiser = require("./apps/advertiser/advertiser")
  , publisher  = require("./apps/publisher/publisher");

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
    app.use(express.vhost("advertiser.test.com", advertiser.app));
    app.use(express.vhost("publisher.test.com", publisher.app));
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
    app.use(express.vhost("advertiser.citreo.us", advertiser.app));
    app.use(express.vhost("publisher.citreo.us", publisher.app));
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
    app.use(express.vhost("api.adcrafted.com", api.app));
    app.use(express.vhost("accounts.adcrafted.com", accounts.app));
    app.use(express.vhost("advertiser.adcrafted.com", advertiser.app));
    app.use(express.vhost("publisher.adcrafted.com", publisher.app));
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
    app.set("email_table", config.EMAIL_TABLE);
    // Create a DynamoDB management instance and share among the applications.
    var db = new AWS.DynamoDB();
    app.set("db", db);
    api.app.set("db", db);
    accounts.app.set("db", db);
    advertiser.app.set("db", db);
    publisher.app.set("db", db);
    // Create an S3 management instance and share among the applications.
    var s3_SDK = new AWS.S3();
    api.app.set("s3", new AWSManager.S3(s3_SDK, api.app.get("s3_bucket"),
					config.ADSPACE_IMG_PREFIX,
					config.AD_IMG_PREFIX));
    accounts.app.set(
	"s3", new AWSManager.S3(s3_SDK, accounts.app.get("s3_bucket"),
				config.ADSPACE_IMG_PREFIX,
				config.AD_IMG_PREFIX));
    advertiser.app.set(
	"s3", new AWSManager.S3(s3_SDK, advertiser.app.get("s3_bucket"),
				config.ADSPACE_IMG_PREFIX,
				config.AD_IMG_PREFIX));
    publisher.app.set(
	"s3", new AWSManager.S3(s3_SDK, publisher.app.get("s3_bucket"),
				config.ADSPACE_IMG_PREFIX,
				config.AD_IMG_PREFIX));
    // Create and start a shared job scheduler (interval in milliseconds).
    var jobScheduler = new scheduler.JobScheduler(100);
    jobScheduler.start();
    api.app.set("jobScheduler", jobScheduler);
    accounts.app.set("jobScheduler", jobScheduler);
    advertiser.app.set("jobScheduler", jobScheduler);
    publisher.app.set("jobScheduler", jobScheduler);
    // Error handler.
    app.use(function(err, request, response, next){
	console.error(err.stack);
	response.send(500, "500 - Internal server error");
    });
    // 404 handler.
    app.use(function(request, response, next){
	response.status(404).render("404", {title: "Page Not Found"});
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