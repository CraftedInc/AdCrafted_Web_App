/**
 * Account management app for AdCrafted.
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
  , GoogleStrategy = require("passport-google-oauth").OAuth2Strategy
  , accounts       = require("./../../routes/accounts");

/**
 * The Express application.
 */
var app = express();

/**
 * Management application environment-specific application configuration.
 */
app.configure("local", function() {
    console.log("Using local settings for Account Management Application.");
    app.use(express.logger("dev"));
    app.set("UserTable", config.local.USER_TABLE_NAME);
    app.set("GoogleTable", config.local.GOOGLE_TABLE_NAME);
    app.set("DOMAIN", config.local.DOMAIN);
    app.set("TEST_DOMAIN", config.local.TEST_DOMAIN);
    app.set("PROTOCOL", config.local.PROTOCOL);
    var googleCredentials = require("./../../.local/google-credentials.js");
    app.set("GOOGLE_CLIENT_ID", googleCredentials.clientID);
    app.set("GOOGLE_CLIENT_SECRET", googleCredentials.clientSecret);
});
app.configure("development", function() {
    app.use(express.logger("dev"));
    app.set("UserTable", config.development.USER_TABLE_NAME5);
    app.set("GoogleTable", config.development.GOOGLE_TABLE_NAME);
    app.set("DOMAIN", config.development.DOMAIN);
    app.set("PROTOCOL", config.development.PROTOCOL);
    app.set("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
    app.set("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);
});
app.configure("production", function() {
    app.use(express.logger("tiny"));
    app.set("UserTable", config.production.USER_TABLE_NAME);
    app.set("GoogleTable", config.production.GOOGLE_TABLE_NAME);
    app.set("DOMAIN", config.production.DOMAIN);
    app.set("PROTOCOL", config.production.PROTOCOL);
    app.set("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
    app.set("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);
});

/**
 * To support persistent login sessions, Passport needs to be able to serialize
 * users into and deserialize users out of the session.
 */
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

/**
 * Configure Passport to use Google's OAuth-2.0 strategy.
 */
passport.use(new GoogleStrategy(
    {
	clientID: app.get("GOOGLE_CLIENT_ID"),
	clientSecret: app.get("GOOGLE_CLIENT_SECRET"),
	callbackURL: app.get("PROTOCOL") + "accounts." +
	    app.get("DOMAIN") + "/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
	// Associate the Google profile with a user record in the DB.
	accounts.findOrCreate(app.get("db"),
			      app.get("GoogleTable"),
			      app.get("UserTable"),
			      profile.id,
			      profile.displayName,
			      profile.emails[0].value,
			      function(err, user) {
				  return done(err, user);
			      });
    }
));

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
    app.use(express.json({limit: '50mb'}));
    app.use(express.urlencoded({limit: '50mb'}));
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
 * The management app.
 */

// This route ensures that the static content required to run the management
// app is only accessible to authenticated users.
app.get("/", connect.ensureLoggedIn("/login"),
	function(request, response, next) {
	    next();
	});

/**
 * Authentication routes are below.
 */

// User logs in by following this URL.
app.get("/login", accounts.login);

// User logs out by following this URL.
app.get("/logout", accounts.logout);

// Authentication route via Google.
app.get("/auth/google",
	passport.authenticate(
	    "google",
	    {
		scope: [
		    "https://www.googleapis.com/auth/userinfo.profile",
		    "https://www.googleapis.com/auth/userinfo.email"
		]
	    }
	),
	function(request, response){
	    // The request will be redirected to Google for authentication.
	    // This function will not be called.
	});

// Callback URL after authentication.
app.get("/auth/google/callback",
	passport.authenticate(
	    "google",
	    { failureRedirect: "/login" }),
	function(request, response) {
	    var subdomain = request.session.subdomain || "www";
	    var url = request.app.get("PROTOCOL") + subdomain + "." +
		request.app.get("DOMAIN");
	    response.redirect(url);
	});

exports.app = app;
