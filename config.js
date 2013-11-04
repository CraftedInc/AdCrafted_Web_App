/**
 * Configuration file for AdCrafted application.
 */
var config = {};

/**
 * General configuration
 */
config.VIEW_ENGINE = "jade";
config.EMAIL_TABLE = "AdCrafted-emails";
config.AD_IMG_PREFIX = "Ad-Images";
config.ADSPACE_IMG_PREFIX = "AdSpace-Images";
config.VIEWS_PATH = "/views";
config.USER_WHITELIST = ["jbpasko@gmail.com", "james@adcrafted.com",
			 "brandon@pepwuper.com", "brandon.wu.com@gmail.com",
			 "brandon@adcrafted.com"];

/**
 * Local configuration.
 */
config.local = {
    PROTOCOL: "http://",
    DOMAIN: "test.com:8888",
    TEST_DOMAIN: "test.com",
    S3_BUCKET: "AdCrafted-DEV",
    ADSPACE_TABLE_NAME: "AdCrafted-AdSpace-DEV",
    AD_TABLE_NAME: "AdCrafted-Ad-DEV",
    USER_TABLE_NAME: "User-DEV",
    STATIC_PATH: "public/development"
};

/**
 * Development configuration.
 */
config.development = {
    PROTOCOL: "http://",
    DOMAIN: "citreo.us",
    S3_BUCKET: "AdCrafted-DEV",
    ADSPACE_TABLE_NAME: "AdCrafted-AdSpace-DEV",
    AD_TABLE_NAME: "AdCrafted-Ad-DEV",
    USER_TABLE_NAME: "User-DEV",
    STATIC_PATH: "public/development"
};

/**
 * Production configuration.
 */
config.production = {
    PROTOCOL: "http://",
    DOMAIN: "adcrafted.com",
    S3_BUCKET: "AdCrafted-PROD",
    ADSPACE_TABLE_NAME: "AdCrafted-AdSpace-PROD",
    AD_TABLE_NAME: "AdCrafted-Ad-PROD",
    USER_TABLE_NAME: "User-PROD",
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
