/**
 * App Module.
 */
angular.module("appcrafted", ["cSpaceServices", "assetServices", "accountServices", "customDirectives", "fileServices", "ui.bootstrap"]).
    config(["$routeProvider",  function($routeProvider) {
	$routeProvider.
	    when("/", {templateUrl: "partials/home.html",   controller: HomeCtrl}).
	    when("/assets", {templateUrl: "partials/cspace-list.html",   controller: CSpaceListCtrl}).
	    when("/assets/new", {templateUrl: "partials/create-cspace.html",   controller: CreateCSpaceCtrl}).
	    when("/assets/:CSpaceID/edit", {templateUrl: "partials/edit-cspace.html", controller: EditCSpaceCtrl}).
	    when("/assets/:CSpaceID", {templateUrl: "partials/asset-list.html", controller: AssetListCtrl}).
	    when("/assets/:CSpaceID/new", {templateUrl: "partials/create-asset.html", controller: CreateAssetCtrl}).
	    when("/assets/:CSpaceID/:AssetID/edit", {templateUrl: "partials/edit-asset.html", controller: EditAssetCtrl}).
	    when("/account", {templateUrl: "partials/account.html",   controller: AccountCtrl}).
	    when("/account/edit", {templateUrl: "partials/edit-account.html",   controller: EditAccountCtrl}).
	    when("/documentation", {templateUrl: "partials/docs.html",   controller: DocsCtrl}).
	    when("/downloads", {templateUrl: "partials/downloads.html",   controller: DownloadsCtrl}).
	    when("/pricing", {templateUrl: "partials/pricing.html",   controller: PricingCtrl}).
	    otherwise({redirectTo: "/"});
    }]);
