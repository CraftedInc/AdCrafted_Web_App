/**
 * App Module.
 */

angular.module("adcrafted", ["adSpaceServices", "adServices", "customDirectives", "fileServices", "ui.bootstrap"]).
    config(["$routeProvider",  function($routeProvider) {
	$routeProvider.
	    when("/adspaces", {templateUrl: "partials/adspace-list.html",   controller: AdSpaceListCtrl}).
	    when("/adspaces/new", {templateUrl: "partials/create-adspace.html",   controller: CreateAdSpaceCtrl}).
	    when("/adspaces/:AdSpaceID/edit", {templateUrl: "partials/edit-adspace.html", controller: EditAdSpaceCtrl}).
	    when("/adspaces/:AdSpaceID", {templateUrl: "partials/adspace-detail.html", controller: AdSpaceDetailCtrl}).
	    when("/adspaces/:AdSpaceID/ad/new", {templateUrl: "partials/create-ad.html", controller: CreateAdCtrl}).
	    when("/adspaces/:AdSpaceID/ad/:AdID/edit", {templateUrl: "partials/edit-ad.html", controller: EditAdCtrl}).
	    when("/adspaces/:AdSpaceID/ad/:AdID/metrics", {templateUrl: "partials/ad-metrics.html", controller: AdMetricsCtrl}).
	    otherwise({redirectTo: "/adspaces"});
    }]);
