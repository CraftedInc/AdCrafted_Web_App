// Create a module named "adSpaceServices" with a dependency on "ngResource".
var adSpaceServices = angular.module("adSpaceServices", ["ngResource"]);

adSpaceServices.factory("AdSpaceCollection", function($resource){
    return $resource("/api/adspace", {}, {
	create: {method: "POST"},
	get: {method: "GET"}
    });
});

adSpaceServices.factory("SingleAdSpace", function($resource){
    return $resource("/api/adspace/:adSpaceID", {}, {
	get: {method: "GET"},
	update: {method: "PUT"},
	del: {method: "DELETE"}
    });
});

// A module for Ad services.
var adServices = angular.module("adServices", ["ngResource"]);

adServices.factory("AdCollection", function($resource) {
    return $resource("/api/adspace/:adSpaceID/ad", {}, {
	create: {method: "POST"},
	get: {method: "GET"}
    });
});

adServices.factory("SingleAd", function($resource){
    return $resource("/api/adspace/:adSpaceID/ad/:adID", {}, {
	get: {method: "GET"},
	update: {method: "PUT"},
	del: {method: "DELETE"}
    });
});

adServices.factory("AdMetrics", function($resource){
    return $resource("/api/adspace/:adSpaceID/ad/:adID/metrics", {}, {
	get: {method: "GET", isArray: true}
    });
});

// A module for file-related services.
var fileServices = angular.module("fileServices", []);

fileServices.factory("CustomFileReader", function($q, $log) {
    var onLoad = function(reader, deferred, scope) {
        return function () {
            scope.$apply(function () {
                deferred.resolve(reader.result);
            });
        };
    };

    var onError = function (reader, deferred, scope) {
        return function () {
            scope.$apply(function () {
                deferred.reject(reader.result);
            });
        };
    };

    var onProgress = function(reader, scope) {
        return function (event) {
            scope.$broadcast("fileProgress",
			     {
				 total: event.total,
				 loaded: event.loaded
			     });
        };
    };

    var getReader = function(deferred, scope) {
        var reader = new FileReader();
        reader.onload = onLoad(reader, deferred, scope);
        reader.onerror = onError(reader, deferred, scope);
        reader.onprogress = onProgress(reader, scope);
        return reader;
    };

    var readAsDataURL = function (file, scope) {
        var deferred = $q.defer();
        
        var reader = getReader(deferred, scope);         
        reader.readAsDataURL(file);
        
        return deferred.promise;
    };

    return {
        readAsDataUrl: readAsDataURL  
    };
});
