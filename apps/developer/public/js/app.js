/**
 * App Module.
 */
angular.module("appcrafted", ["cSpaceServices", "adServices", "assetServices", "accountServices", "customDirectives", "fileServices", "ui.bootstrap"]).
    config(["$routeProvider",  function($routeProvider) {
	$routeProvider.
	    when("/cspaces", {templateUrl: "partials/cspace-list.html",   controller: CSpaceListCtrl}).
	    when("/cspaces/new", {templateUrl: "partials/create-cspace.html",   controller: CreateCSpaceCtrl}).
	    when("/cspaces/:CSpaceID/edit", {templateUrl: "partials/edit-cspace.html", controller: EditCSpaceCtrl}).
	    when("/cspaces/:CSpaceID/ad", {templateUrl: "partials/ad-list.html", controller: AdListCtrl}).
	    when("/cspaces/:CSpaceID/ad/new", {templateUrl: "partials/create-ad.html", controller: CreateAdCtrl}).
	    when("/cspaces/:CSpaceID/ad/:AdID/edit", {templateUrl: "partials/edit-ad.html", controller: EditAdCtrl}).
	    when("/cspaces/:CSpaceID/ad/:AdID/metrics", {templateUrl: "partials/ad-metrics.html", controller: AdMetricsCtrl}).
	    when("/cspaces/:CSpaceID/asset", {templateUrl: "partials/asset-list.html", controller: AssetListCtrl}).
	    when("/cspaces/:CSpaceID/asset/new", {templateUrl: "partials/create-asset.html", controller: CreateAssetCtrl}).
	    when("/cspaces/:CSpaceID/asset/:AssetID/edit", {templateUrl: "partials/edit-asset.html", controller: EditAssetCtrl}).
	    when("/cspaces/:CSpaceID/asset/:AssetID/metrics", {templateUrl: "partials/asset-metrics.html", controller: AssetMetricsCtrl}).
	    when("/account", {templateUrl: "partials/account.html",   controller: AccountCtrl}).
	    when("/account/edit", {templateUrl: "partials/edit-account.html",   controller: EditAccountCtrl}).
	    when("/documentation", {templateUrl: "partials/docs.html",   controller: DocsCtrl}).
	    otherwise({redirectTo: "/cspaces"});
    }]);
