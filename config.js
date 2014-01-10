/**
 * Configuration file for AppCrafted application.
 */
var config = {};

/**
 * General configuration
 */
config.VIEW_ENGINE = "jade";
config.AD_FILE_PREFIX = "Ad-Files";
config.ASSET_FILE_PREFIX = "Asset-Files";
config.CSPACE_FILE_PREFIX = "CraftedSpace-Files";
config.VIEWS_PATH = "/views";
config.APPS_VIEWS_PATH = "/../../views";
config.USER_WHITELIST = ["jbpasko@gmail.com",
			 "brandon@pepwuper.com", "brandon.wu.com@gmail.com",
			 "michael.nadel@gmail.com", "ianrosenwach@gmail.com",
			 "zachaikman@gmail.com"];
config.ADMIN_EMAILS = ["james@adcrafted.com", "brandon@adcrafted.com"];
config.NOTIFICATIONS_EMAIL = "AppCrafted Notifications <notifications@appcrafted.com>";
config.CSPACE_USER_ID_INDEX = "CSpaceUserID-INDEX";
config.ASSET_USER_ID_INDEX = "AssetUserID-INDEX";
config.ALLOW_ORIGINS = "*";
config.ALLOW_METHODS = "GET,POST,PUT,DELETE";
config.ALLOW_HEADERS = "Content-Type,Authorization";
config.ATTRIBUTE_TYPE_KEY = "Type";
config.ATTRIBUTE_VALUE_KEY = "Value";
config.ATTRIBUTE_ACTION_KEY = "Action";
config.STRING_TYPE = "STRING";
config.URL_TYPE = "URL";
config.IMAGE_TYPE = "IMAGE";
config.FILE_TYPE = "FILE";
config.ARRAY_TYPE = "ARRAY";
config.STRING_ARRAY_TYPE = "STRING_ARRAY";
config.NUMBER_ARRAY_TYPE = "NUMBER_ARRAY";
config.NUMBER_TYPE = "NUMBER";
config.DELETE_ATTRIBUTE_ACTION = "DELETE";
config.UPDATE_ATTRIBUTE_ACTION = "UPDATE";
config.MAX_FILE_SIZE_KB = 500;

/**
 * Local configuration.
 */
config.local = {
    PROTOCOL: "http://",
    DOMAIN: "test.com:8888",
    TEST_DOMAIN: "test.com",
    S3_BUCKET: "adcrafted-dev",
    CDN_ENDPOINT: null,
    CSPACE_TABLE_NAME: "AdCrafted-CraftedSpace-DEV",
    AD_TABLE_NAME: "AdCrafted-Ad-DEV",
    ASSET_TABLE_NAME: "AppCrafted-Asset-DEV",
    USER_TABLE_NAME: "AdCrafted-User-DEV",
    GOOGLE_TABLE_NAME: "AdCrafted-Google-DEV",
    AD_METRICS_TABLE_NAME: "AdCrafted-AdMetrics-DEV",
    ASSET_METRICS_TABLE_NAME: "AdCrafted-AssetMetrics-DEV",
    STATIC_PATH: "public/development"
};

/**
 * Development configuration.
 */
config.development = {
    PROTOCOL: "http://",
    DOMAIN: "citreo.us",
    S3_BUCKET: "adcrafted-dev",
    CDN_ENDPOINT: null,
    CSPACE_TABLE_NAME: "AdCrafted-CraftedSpace-DEV",
    AD_TABLE_NAME: "AdCrafted-Ad-DEV",
    ASSET_TABLE_NAME: "AppCrafted-Asset-DEV",
    USER_TABLE_NAME: "AdCrafted-User-DEV",
    GOOGLE_TABLE_NAME: "AdCrafted-Google-DEV",
    AD_METRICS_TABLE_NAME: "AdCrafted-AdMetrics-DEV",
    ASSET_METRICS_TABLE_NAME: "AdCrafted-AssetMetrics-DEV",
    STATIC_PATH: "public/development"
};

/**
 * Production configuration.
 */
config.production = {
    PROTOCOL: "https://",
    DOMAIN: "appcrafted.com",
    S3_BUCKET: "cdn.appcrafted.com",
    CDN_ENDPOINT: "http://cdn.appcrafted.com/",
    CSPACE_TABLE_NAME: "AppCrafted-CraftedSpace-PROD",
    AD_TABLE_NAME: "AppCrafted-Ad-PROD",
    ASSET_TABLE_NAME: "AppCrafted-Asset-PROD",
    USER_TABLE_NAME: "AppCrafted-User-PROD",
    GOOGLE_TABLE_NAME: "AppCrafted-Google-PROD",
    AD_METRICS_TABLE_NAME: "AppCrafted-AdMetrics-PROD",
    ASSET_METRICS_TABLE_NAME: "AppCrafted-AssetMetrics-PROD",
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
