/**
 * Controllers
 */

function AdSpaceListCtrl($scope, AdSpaceCollection, SingleAdSpace) {
    $scope.AdSpaces = AdSpaceCollection.get();
    $scope.orderReverse = false;
    $scope.orderProp = "date";
    $scope.populateSearch = function(tag) {
	$scope.query = tag;
    }
}

function AdSpaceDetailCtrl($scope, $routeParams, AdCollection) {
    $scope.AdSpaceID = $routeParams.AdSpaceID;
    $scope.AdCollection = AdCollection.get({adSpaceID: $scope.AdSpaceID});
    $scope.orderReverse = false;
    $scope.orderProp = "date";
}

function CreateAdSpaceCtrl($scope, AdSpaceCollection, CustomFileReader) {
    $scope.adSpace = {};

    // Pre-populate the imageSrc with null to allow the fallback src attribute
    // to work properly.
    $scope.imageSrc = "null";

    // Read the file from the drop event on the tag with imageDrop directive.
    // The tag with the directive must also specify an on-change attribute,
    // which should reference this function.
    $scope.readFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.adSpace.image = result;
		// Update imageSrc so that the image displays immediately.
		$scope.imageSrc = result;
            });
    };

    // Call the create service which wraps a call to the REST API, thus creating
    // the new AdSpace.
    $scope.create = function(newAdSpaceForm) {
	if (newAdSpaceForm.$valid) {
	    AdSpaceCollection.create($scope.adSpace, function() {
		window.location = "#/adspaces/";
	    });
	}
    }
}

function EditAdSpaceCtrl($scope, $routeParams, SingleAdSpace, CustomFileReader) {
    $scope.adSpace =
	SingleAdSpace.get({adSpaceID: $routeParams.AdSpaceID}, function() {
	    $scope.imageSrc = $scope.adSpace.image ?
		$scope.adSpace.image : "null";
	});

    $scope.readFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.adSpace.image = result;
		$scope.imageSrc = result;
            });
    };

    $scope.update = function(AdSpaceForm) {
	if (AdSpaceForm.$valid) {
	    SingleAdSpace.update({adSpaceID: $routeParams.AdSpaceID},
				 $scope.adSpace, function() {
				     window.location = "#/adspaces/";
				 });
	}
    }

    $scope.del = function() {
	SingleAdSpace.del({adSpaceID: $routeParams.AdSpaceID}, function() {
	    window.location = "#/adspaces/";
	});
    }
}

function CreateAdCtrl($scope, $routeParams, AdCollection, CustomFileReader) {
    $scope.adSpaceID = $routeParams.AdSpaceID;

    $scope.ad = {};

    $scope.imageSrc = "null";

    $scope.readFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.ad.image = result;
		$scope.imageSrc = result;
            });
    };

    $scope.create = function(newAdForm) {
	if (newAdForm.$valid) {
	    AdCollection.create({adSpaceID: $routeParams.AdSpaceID},
				$scope.ad, function() {
				    window.location = "#/adspaces/" +
					$routeParams.AdSpaceID;
				});
	}
    }
}

function EditAdCtrl($scope, $routeParams, SingleAd, CustomFileReader) {
    $scope.adSpaceID = $routeParams.AdSpaceID;

    $scope.ad = SingleAd.get({adID: $routeParams.AdID,
			      adSpaceID: $routeParams.AdSpaceID}, function() {
				  $scope.imageSrc = $scope.ad.image ?
				      $scope.ad.image : "null";
			      });

    $scope.readFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.ad.image = result;
		$scope.imageSrc = result;
            });
    };

    $scope.update = function(AdForm) {
	if (AdForm.$valid) {
	    SingleAd.update({adSpaceID: $routeParams.AdSpaceID,
			     adID: $routeParams.AdID},
			    $scope.ad, function() {
				window.location =
				    "#/adspaces/" + $routeParams.AdSpaceID;
			    });
	}
    }

    $scope.del = function() {
	SingleAd.del({adSpaceID: $routeParams.AdSpaceID,
		      adID: $routeParams.AdID}, function() {
			  window.location =
			      "#/adspaces/" + $routeParams.AdSpaceID;
		      });
    }
}

function AdMetricsCtrl($scope, $routeParams, AdMetrics) {
    $scope.AdSpaceID = $routeParams.AdSpaceID;
    $scope.ctr = "--";
    $scope.impressions = 0;
    $scope.clicks = 0;
    $scope.impressionsSeries = "";
    $scope.clicksSeries = "";
    $scope.metrics =
	AdMetrics.get({adID: $routeParams.AdID,
		       adSpaceID: $routeParams.AdSpaceID},
		      function() {
			  var metrics = $scope.metrics;
			  for (var i = 0; i < metrics.length; i++) {
			      $scope.impressions += 
			      parseInt(metrics[i].impressions);
			      $scope.clicks += parseInt(metrics[i].clicks);
			      $scope.impressionsSeries += metrics[i].Date +
				  "," + metrics[i].impressions + "\n";
			      $scope.clicksSeries += metrics[i].Date +
				  "," + metrics[i].clicks + "\n";
			  }
			  $scope.ctr = $scope.impressions > 0 ?
			      Math.floor(($scope.clicks /
					  $scope.impressions) * 100) : 0;
		      });
}

function AccountCtrl($scope, $routeParams, Account) {
    $scope.account = Account.get();
    $scope.showCredentials = false;
}

function EditAccountCtrl($scope, $routeParams, Account) {
    $scope.account = Account.get();

    $scope.update = function(AccountForm) {
	if (AccountForm.$valid) {
	    Account.update({},
			   {"Name": $scope.account.Name,
			    "Email": $scope.account.Email},
			   function() {
			       window.location = "#/account/";
			   });
	}
    }
}
