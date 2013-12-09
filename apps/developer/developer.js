/**
 * Developer portal for AdCrafted.
 *
 * Currently, 3 environments are supported.
 * See server.js for instructions.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * Include modules here.
 */
var express  = require("express")
  , config   = require("./../../config")
  , Redis    = require("connect-redis")(express)
  , path     = require("path")
  , passport = require("passport")
  , connect  = require("connect-ensure-login")
  , utils    = require("./../../utils/utils")
  , ads      = require("./../../routes/ads")
  , cspaces  = require("./../../routes/craftedspaces")
  , accounts = require("./../../routes/accounts");

/**
 * The Express application.
 */
var app = express();

/**
 * Developer application environment-specific application configuration.
 */
app.configure("local", function() {
    console.log("Using local settings for Developer Application.");
    app.use(express.logger("dev"));
    app.set("S3Bucket", config.local.S3_BUCKET);
    app.set("CSpaceTable", config.local.CSPACE_TABLE_NAME);
    app.set("AdTable", config.local.AD_TABLE_NAME);
    app.set("UserTable", config.local.USER_TABLE_NAME);
    app.set("MetricsTable", config.local.METRICS_TABLE_NAME);
    app.set("DOMAIN", config.local.DOMAIN);
    app.set("TEST_DOMAIN", config.local.TEST_DOMAIN);
    app.set("PROTOCOL", config.local.PROTOCOL);
});
app.configure("development", function() {
    app.use(express.logger("dev"));
    app.set("S3Bucket", config.development.S3_BUCKET);
    app.set("CSpaceTable", config.development.CSPACE_TABLE_NAME);
    app.set("AdTable", config.development.AD_TABLE_NAME);
    app.set("UserTable", config.development.USER_TABLE_NAME);
    app.set("MetricsTable", config.development.METRICS_TABLE_NAME);
    app.set("DOMAIN", config.development.DOMAIN);
    app.set("PROTOCOL", config.development.PROTOCOL);
});
app.configure("production", function() {
    app.use(express.logger("tiny"));
    app.set("S3Bucket", config.production.S3_BUCKET);
    app.set("CSpaceTable", config.production.CSPACE_TABLE_NAME);
    app.set("AdTable", config.production.AD_TABLE_NAME);
    app.set("UserTable", config.production.USER_TABLE_NAME);
    app.set("MetricsTable", config.production.METRICS_TABLE_NAME);
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
    app.set("views", path.join(__dirname, config.APPS_VIEWS_PATH));
    app.set("view engine", config.VIEW_ENGINE);
    app.use(express.compress());
    app.use(express.static(path.join(__dirname, "./public")));
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
 * The advertiser portal app.
 */

// This route ensures that the static content required to run the advertiser
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

// CREATE a new CraftedSpace.
app.post("/api/cspace",
	 utils.ensureAuthenticated(),
	 cspaces.createCraftedSpace);

// RETRIEVE all CraftedSpaces owned by the User.
app.get("/api/cspace",
	utils.ensureAuthenticated(),
	cspaces.getAllUserCraftedSpaces);

// RETRIEVE all public CraftedSpaces.
app.get("/api/cspace/public",
	utils.ensureAuthenticated(),
	cspaces.getAllPublicCraftedSpaces);

// RETRIEVE a single CraftedSpace.
app.get("/api/cspace/:cSpaceID",
	utils.ensureAuthenticated(),
	cspaces.getCraftedSpace);

// UPDATE an CraftedSpace.
app.put("/api/cspace/:cSpaceID",
	utils.ensureAuthenticated(),
	cspaces.updateCraftedSpace);

// DELETE an CraftedSpace and all ads it may reference.
app.del("/api/cspace/:cSpaceID",
	utils.ensureAuthenticated(),
	cspaces.deleteCraftedSpace);

// CREATE an ad in the specified CraftedSpace.
app.post("/api/cspace/:cSpaceID/ad",
	 utils.ensureAuthenticated(),
	 ads.createAd);

// RETRIEVE all ads within the specified CraftedSpace.
app.get("/api/cspace/:cSpaceID/ad",
	utils.ensureAuthenticated(),
	ads.getAllAdsInCraftedSpace);

// RETRIEVE a single ad from the specified CraftedSpace.
app.get("/api/cspace/:cSpaceID/ad/:adID",
	utils.ensureAuthenticated(),
	ads.getAd);

// RETRIEVE all Ads owned by the user.
app.get("/api/ad",
	utils.ensureAuthenticated(),
	ads.getAllUserAds);

// UPDATE an ad.
app.put("/api/cspace/:cSpaceID/ad/:adID",
	utils.ensureAuthenticated(),
	ads.updateAd);

// DELETE an ad without deleting the CraftedSpace.
app.del("/api/cspace/:cSpaceID/ad/:adID",
	utils.ensureAuthenticated(),
	ads.deleteAd);

// GET the metrics for an ad.
app.get("/api/cspace/:cSpaceID/ad/:adID/metrics",
	utils.ensureAuthenticated(),
	ads.getMetrics);

// GET a user's account (user must be logged in).
app.get("/api/account",
	utils.ensureAuthenticated(),
	accounts.getAccount);

// UPDATE a user's account (user must be logged in).
app.put("/api/account",
	utils.ensureAuthenticated(),
	accounts.updateAccount);

exports.app = app;
