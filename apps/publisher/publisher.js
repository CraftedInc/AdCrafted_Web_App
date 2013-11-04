/**
 * Publisher Portal for AdCrafted.
 *
 * Currently, 3 environments are supported.
 * See server.js for instructions.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * Include modules here.
 */
var express        = require("express")
  , config         = require("./../../config")
  , Redis          = require("connect-redis")(express)
  , path           = require("path")
  , passport       = require("passport")
  , connect        = require("connect-ensure-login")
  , utils          = require("./../../utils/utils")
  , ads            = require("./../../routes/ads")
  , adspaces       = require("./../../routes/adspaces")
  , accounts       = require("./../../routes/accounts");

/**
 * The Express application.
 */
var app = express();

/**
 * Publisher application environment-specific application configuration.
 */
app.configure("local", function() {
    console.log("Using local settings for Publisher Application.");
    app.use(express.logger("dev"));
    app.set("s3_bucket", config.local.S3_BUCKET);
    app.set("adspace_table_name", config.local.ADSPACE_TABLE_NAME);
    app.set("ads_table_name", config.local.AD_TABLE_NAME);
    app.set("user_table_name", config.local.USER_TABLE_NAME);
    app.set("DOMAIN", config.local.DOMAIN);
    app.set("TEST_DOMAIN", config.local.TEST_DOMAIN);
    app.set("PROTOCOL", config.local.PROTOCOL);
});
app.configure("development", function() {
    app.use(express.logger("dev"));
    app.set("s3_bucket", config.development.S3_BUCKET);
    app.set("adspace_table_name", config.development.ADSPACE_TABLE_NAME);
    app.set("ads_table_name", config.development.AD_TABLE_NAME);
    app.set("user_table_name", config.development.USER_TABLE_NAME);
    app.set("DOMAIN", config.development.DOMAIN);
    app.set("PROTOCOL", config.development.PROTOCOL);
});
app.configure("production", function() {
    app.use(express.logger("tiny"));
    app.set("s3_bucket", config.production.S3_BUCKET);
    app.set("adspace_table_name", config.production.ADSPACE_TABLE_NAME);
    app.set("ads_table_name", config.production.AD_TABLE_NAME);
    app.set("user_table_name", config.production.USER_TABLE_NAME);
    app.set("DOMAIN", config.production.DOMAIN);
    app.set("PROTOCOL", config.production.PROTOCOL);
});

/**
 * General application configuration.
 */
app.configure(function() {
    app.use(express.cookieParser());
    var domain = app.get("TEST_DOMAIN") || app.get("DOMAIN");
    app.use(express.cookieSession({
	key: "connect.sid",
	secret: "spindrift",
	store: new Redis(),
	cookie: {
	    domain: "." + domain,
	    maxAge: 604800000 // One week.
	}
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.compress());
    app.use(express.static(path.join(__dirname, "./public")));
    // Error handler.
    app.use(function(err, request, response, next){
	console.error(err.stack);
	response.send(500, '500 - Error.');
    });
    // 404 handler.
    app.use(function(request, response, next){
	response.send(404, '404 - Not Found.');
    });
});

/**
 * The publisher app.
 */

// This route ensures that the static content required to run the publisher
// app is only accessible to authenticated users.
app.get("/", connect.ensureLoggedIn("/login"),
	function(request, response, next) {
	    next();
	});

// LOGIN by this URL.
app.get("/login", accounts.login);

// LOGOUT by this URL.
app.get("/logout", accounts.logout);

/**
 * The internal API, secured by a session-based authentication service.
 */

// CREATE a new AdSpace.
app.post("/api/adspace",
	 utils.ensureAuthenticated(),
	 adspaces.createAdSpace);

// RETRIEVE all AdSpaces.
app.get("/api/adspace",
	utils.ensureAuthenticated(),
	adspaces.getAllAdSpaces);

// RETRIEVE a single AdSpace.
app.get("/api/adspace/:adspace_id",
	utils.ensureAuthenticated(),
	adspaces.getAdSpace);

// UPDATE an AdSpace.
app.put("/api/adspace/:adspace_id",
	utils.ensureAuthenticated(),
	adspaces.updateAdSpace);

// DELETE an AdSpace and all ads it may reference.
app.del("/api/adspace/:adspace_id",
	utils.ensureAuthenticated(),
	adspaces.deleteAdSpace);

// CREATE an ad in the specified AdSpace.
app.post("/api/adspace/:adspace_id/ad",
	 utils.ensureAuthenticated(),
	 ads.createAd);

// RETRIEVE all ads within the specified AdSpace.
app.get("/api/adspace/:adspace_id/ad",
	utils.ensureAuthenticated(),
	ads.getAllAds);

// RETRIEVE a single ad from the specified AdSpace.
app.get("/api/adspace/:adspace_id/ad/:ad_id",
	utils.ensureAuthenticated(),
	ads.getAd);

// UPDATE an ad.
app.put("/api/adspace/:adspace_id/ad/:ad_id",
	utils.ensureAuthenticated(),
	ads.updateAd);

// DELETE an ad without deleting the AdSpace.
app.del("/api/adspace/:adspace_id/ad/:ad_id",
	utils.ensureAuthenticated(),
	ads.deleteAd);

exports.app = app;

