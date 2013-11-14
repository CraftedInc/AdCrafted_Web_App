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
    app.set("s3_bucket", config.local.S3_BUCKET);
    app.set("user_table_name", config.local.USER_TABLE_NAME);
    app.set("google_table_name", config.local.GOOGLE_TABLE_NAME);
    app.set("DOMAIN", config.local.DOMAIN);
    app.set("TEST_DOMAIN", config.local.TEST_DOMAIN);
    app.set("PROTOCOL", config.local.PROTOCOL);
    var googleCredentials = require("./../../.local/google-credentials.js");
    app.set("GOOGLE_CLIENT_ID", googleCredentials.clientID);
    app.set("GOOGLE_CLIENT_SECRET", googleCredentials.clientSecret);
});
app.configure("development", function() {
    app.use(express.logger("dev"));
    app.set("s3_bucket", config.development.S3_BUCKET);
    app.set("user_table_name", config.development.USER_TABLE_NAME);
    app.set("google_table_name", config.development.GOOGLE_TABLE_NAME);
    app.set("DOMAIN", config.development.DOMAIN);
    app.set("PROTOCOL", config.development.PROTOCOL);
    app.set("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
    app.set("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);
});
app.configure("production", function() {
    app.use(express.logger("tiny"));
    app.set("s3_bucket", config.production.S3_BUCKET);
    app.set("user_table_name", config.production.USER_TABLE_NAME);
    app.set("google_table_name", config.production.GOOGLE_TABLE_NAME);
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
			      app.get("google_table_name"),
			      app.get("user_table_name"),
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
	    // Successful authentication, redirect to the requested app.
	    // But first, let's check that you're white-listed.
	    // NOTE: this white-listing logic should be removed once our service
	    // goes public.
	    var authorized = false;
	    for (var i = 0; i < config.USER_WHITELIST.length; i++) {
		if (config.USER_WHITELIST[i] == request.user.email) {
		    authorized = true;
		    break;
		}
	    }
	    if (authorized) {
		var subdomain = request.session.subdomain || "www";
		var url = "http://" + subdomain + "." + request.app.get("DOMAIN");
	    } else {
		var url = "http://www." + request.app.get("DOMAIN") +
		    "?email=" + request.user.email;
		request.logout();
	    }
	    response.redirect(url);
	});

exports.app = app;
