/**
 * Controllers
 */

function AdSpaceListCtrl($scope, AdSpaceCollection, SingleAdSpace) {
    $scope.waiting = true;
    $scope.AdSpaces = AdSpaceCollection.get({}, function() {$scope.waiting = false});
    $scope.orderReverse = false;
    $scope.orderProp = "date";
    $scope.populateSearch = function(tag) {
	$scope.query = tag;
    }
}

function AdSpaceDetailCtrl($scope, $routeParams, AdCollection) {
    $scope.waiting = true;
    $scope.AdSpaceID = $routeParams.AdSpaceID;
    $scope.AdCollection = AdCollection.get({adSpaceID: $scope.AdSpaceID},
					   function() {$scope.waiting = false});
    $scope.orderReverse = false;
    $scope.orderProp = "date";
}

function CreateAdSpaceCtrl($scope, AdSpaceCollection, CustomFileReader) {
    $scope.waiting = false;
    $scope.adSpace = {};
    $scope.hasImage = false;

    // Read the file from the drop event on the tag with imageDrop directive.
    // The tag with the directive must also specify an on-change attribute,
    // which should reference this function.
    $scope.readImageFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.adSpace.image = result;
		// Update imageSrc so that the image displays immediately.
		$scope.imageSrc = result;
		$scope.hasImage = true;
            });
    };

    // Call the create service which wraps a call to the REST API, thus creating
    // the new AdSpace.
    $scope.create = function(newAdSpaceForm) {
	if (newAdSpaceForm.$valid) {
	    $scope.waiting = true;
	    AdSpaceCollection.create($scope.adSpace, function() {
		window.location = "#/adspaces/";
	    });
	}
    }
}

function EditAdSpaceCtrl($scope, $routeParams, SingleAdSpace, CustomFileReader) {
    $scope.waiting = true;
    $scope.hasImage = false;
    $scope.adSpace =
	SingleAdSpace.get({adSpaceID: $routeParams.AdSpaceID}, function() {
	    $scope.waiting = false;
	    $scope.imageSrc = $scope.adSpace.image;
	    $scope.hasImage = $scope.adSpace.image != "null";
	});

    $scope.readImageFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.adSpace.image = result;
		$scope.imageSrc = result;
		$scope.hasImage = true;
            });
    };

    $scope.update = function(AdSpaceForm) {
	$scope.waiting = true;
	if (AdSpaceForm.$valid) {
	    SingleAdSpace.update({adSpaceID: $routeParams.AdSpaceID},
				 $scope.adSpace, function() {
				     window.location = "#/adspaces/";
				 });
	}
    }

    $scope.del = function() {
	$scope.waiting = true;
	SingleAdSpace.del({adSpaceID: $routeParams.AdSpaceID}, function() {
	    window.location = "#/adspaces/";
	});
    }
}

function CreateAdCtrl($scope, $routeParams, AdCollection, CustomFileReader) {
    $scope.waiting = false;
    $scope.adSpaceID = $routeParams.AdSpaceID;
    $scope.hasImage = false;

    $scope.ad = {};

    $scope.readImageFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.ad.image = result;
		$scope.imageSrc = result;
		$scope.hasImage = true;
            });
    };

    $scope.create = function(newAdForm) {
	if (newAdForm.$valid) {
	    $scope.waiting = true;
	    AdCollection.create({adSpaceID: $routeParams.AdSpaceID},
				$scope.ad, function() {
				    window.location = "#/adspaces/" +
					$routeParams.AdSpaceID;
				});
	}
    }
}

function EditAdCtrl($scope, $routeParams, SingleAd, CustomFileReader) {
    $scope.waiting = true;
    $scope.hasImage = false;
    $scope.adSpaceID = $routeParams.AdSpaceID;

    $scope.ad = SingleAd.get({adID: $routeParams.AdID,
			      adSpaceID: $routeParams.AdSpaceID}, function() {
				  $scope.waiting = false;
				  $scope.imageSrc = $scope.ad.image;
				  $scope.hasImage = $scope.ad.image != "null";
			      });

    $scope.readImageFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.ad.image = result;
		$scope.imageSrc = result;
		$scope.hasImage = true;
            });
    };

    $scope.update = function(AdForm) {
	if (AdForm.$valid) {
	    $scope.waiting = true;
	    SingleAd.update({adSpaceID: $routeParams.AdSpaceID,
			     adID: $routeParams.AdID},
			    $scope.ad, function() {
				window.location =
				    "#/adspaces/" + $routeParams.AdSpaceID;
			    });
	}
    }

    $scope.del = function() {
	$scope.waiting = true;
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
    $scope.waiting = true;
    $scope.account = Account.get({}, function() {$scope.waiting = false});
    $scope.showCredentials = false;
}

function EditAccountCtrl($scope, $routeParams, Account) {
    $scope.waiting = false;
    $scope.account = Account.get();

    $scope.update = function(AccountForm) {
	if (AccountForm.$valid) {
	    $scope.waiting = true;
	    Account.update({},
			   {"Name": $scope.account.Name,
			    "Email": $scope.account.Email},
			   function() {
			       window.location = "#/account/";
			   });
	}
    }
}
