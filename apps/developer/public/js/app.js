/**
 * App Module.
 */
angular.module("appcrafted", ["cSpaceServices", "assetServices", "accountServices", "customDirectives", "fileServices", "ui.bootstrap"]).
    config(["$routeProvider",  function($routeProvider) {
	$routeProvider.
	    when("/", {templateUrl: "partials/home.html",   controller: HomeCtrl}).
	    when("/cspaces", {templateUrl: "partials/cspace-list.html",   controller: CSpaceListCtrl}).
	    when("/cspaces/new", {templateUrl: "partials/create-cspace.html",   controller: CreateCSpaceCtrl}).
	    when("/cspaces/:CSpaceID/edit", {templateUrl: "partials/edit-cspace.html", controller: EditCSpaceCtrl}).
	    when("/cspaces/:CSpaceID/asset", {templateUrl: "partials/asset-list.html", controller: AssetListCtrl}).
	    when("/cspaces/:CSpaceID/asset/new", {templateUrl: "partials/create-asset.html", controller: CreateAssetCtrl}).
	    when("/cspaces/:CSpaceID/asset/:AssetID/edit", {templateUrl: "partials/edit-asset.html", controller: EditAssetCtrl}).
	    when("/cspaces/:CSpaceID/asset/:AssetID/metrics", {templateUrl: "partials/asset-metrics.html", controller: AssetMetricsCtrl}).
	    when("/account", {templateUrl: "partials/account.html",   controller: AccountCtrl}).
	    when("/account/edit", {templateUrl: "partials/edit-account.html",   controller: EditAccountCtrl}).
	    when("/documentation", {templateUrl: "partials/docs.html",   controller: DocsCtrl}).
	    otherwise({redirectTo: "/cspaces"});
    }]);
