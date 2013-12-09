/**
 * Configuration file for AdCrafted application.
 */
var config = {};

/**
 * General configuration
 */
config.VIEW_ENGINE = "jade";
config.AD_IMG_PREFIX = "Ad-Images";
config.CSPACE_IMG_PREFIX = "CraftedSpace-Images";
config.VIEWS_PATH = "/views";
config.APPS_VIEWS_PATH = "/../../views";
config.USER_WHITELIST = ["jbpasko@gmail.com", "james@adcrafted.com",
			 "brandon@pepwuper.com", "brandon.wu.com@gmail.com",
			 "brandon@adcrafted.com", "jpasko@uw.edu"];
config.ADMIN_EMAILS = ["james@adcrafted.com", "brandon@adcrafted.com"];
config.NOTIFICATIONS_EMAIL = "AdCrafted Notifications <notifications@adcrafted.com>";
config.CSPACE_USER_ID_INDEX = "CSpaceUserID-INDEX";

/**
 * Local configuration.
 */
config.local = {
    PROTOCOL: "http://",
    DOMAIN: "test.com:8888",
    TEST_DOMAIN: "test.com",
    S3_BUCKET: "adcrafted-dev",
    CSPACE_TABLE_NAME: "AdCrafted-CraftedSpace-DEV",
    AD_TABLE_NAME: "AdCrafted-Ad-DEV",
    USER_TABLE_NAME: "AdCrafted-User-DEV",
    GOOGLE_TABLE_NAME: "AdCrafted-Google-DEV",
    METRICS_TABLE_NAME: "AdCrafted-Metrics-DEV",
    STATIC_PATH: "public/development"
};

/**
 * Development configuration.
 */
config.development = {
    PROTOCOL: "http://",
    DOMAIN: "citreo.us",
    S3_BUCKET: "adcrafted-dev",
    CSPACE_TABLE_NAME: "AdCrafted-CraftedSpace-DEV",
    AD_TABLE_NAME: "AdCrafted-Ad-DEV",
    USER_TABLE_NAME: "AdCrafted-User-DEV",
    GOOGLE_TABLE_NAME: "AdCrafted-Google-DEV",
    METRICS_TABLE_NAME: "AdCrafted-Metrics-DEV",
    STATIC_PATH: "public/development"
};

/**
 * Production configuration.
 */
config.production = {
    PROTOCOL: "http://",
    DOMAIN: "adcrafted.com",
    S3_BUCKET: "adcrafted-prod",
    CSPACE_TABLE_NAME: "AdCrafted-CraftedSpace-PROD",
    AD_TABLE_NAME: "AdCrafted-Ad-PROD",
    USER_TABLE_NAME: "AdCrafted-User-PROD",
    GOOGLE_TABLE_NAME: "AdCrafted-Google-PROD",
    METRICS_TABLE_NAME: "AdCrafted-Metrics-PROD",
    STATIC_PATH: "public/production"
};

/**
 * Settings for session storage.
 */
config.session = {
    key: "connect.sid",
    secret: "spindrift",
    cookie: {
	maxAge: 604800000 // One week.
    }
};

module.exports = config;
