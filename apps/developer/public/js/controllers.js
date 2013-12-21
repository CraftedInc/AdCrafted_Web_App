/**
 * The navigation controller activates the current navigation element.
 */

function NavigationCtrl($scope, $location) {
    $scope.isActive = function(path) { 
        return path === $location.path();
    };
    $scope.beginsWith = function(path) { 
        return path === $location.path().substr(0, path.length);
    };
}

/**
 * Home controller.
 */
function HomeCtrl($scope) {}

/**
 * CraftedSpace controllers.
 */

function CSpaceListCtrl($scope, CSpaceCollection) {
    $scope.waiting = true;
    var collection = CSpaceCollection.get({}, function() {
	$scope.waiting = false;
	$scope.CSpaces = collection.CraftedSpaces;
    });
    $scope.orderReverse = false;
    $scope.orderProp = "date";
    $scope.populateSearch = function(tag) {
	$scope.query = tag;
    }
    $scope.clearSearch = function() {
	$scope.query = "";
    }
}

function CreateCSpaceCtrl($scope, CSpaceCollection, CustomFileReader) {
    $scope.waiting = false;
    $scope.cSpace = {};
    $scope.hasImage = false;

    // Read the file from the drop event on the tag with imageDrop directive.
    // The tag with the directive must also specify an on-change attribute,
    // which should reference this function.
    $scope.readImageFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.cSpace.image = result;
		// Update imageSrc so that the image displays immediately.
		$scope.imageSrc = result;
		$scope.hasImage = true;
            });
    };

    // Call the create service which wraps a call to the REST API, thus creating
    // the new CSpace.
    $scope.create = function(newCSpaceForm) {
	if (newCSpaceForm.$valid) {
	    $scope.waiting = true;
	    CSpaceCollection.create($scope.cSpace, function() {
		window.location = "#/cspaces/";
	    });
	}
    }
}

function EditCSpaceCtrl($scope, $routeParams, SingleCSpace, CustomFileReader) {
    $scope.waiting = true;
    $scope.hasImage = false;
    $scope.cSpace =
	SingleCSpace.get({cSpaceID: $routeParams.CSpaceID}, function() {
	    $scope.waiting = false;
	    $scope.imageSrc = $scope.cSpace.image;
	    $scope.hasImage = $scope.cSpace.image != "null";
	});

    $scope.readImageFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.cSpace.image = result;
		$scope.imageSrc = result;
		$scope.hasImage = true;
            });
    };

    $scope.update = function(CSpaceForm) {
	$scope.waiting = true;
	if (CSpaceForm.$valid) {
	    SingleCSpace.update({cSpaceID: $routeParams.CSpaceID},
				 $scope.cSpace, function() {
				     window.location = "#/cspaces/";
				 });
	}
    }

    $scope.del = function() {
	$scope.waiting = true;
	SingleCSpace.del({cSpaceID: $routeParams.CSpaceID}, function() {
	    window.location = "#/cspaces/";
	});
    }
}

/**
 * Ad controllers.
 */

function AdListCtrl($scope, $routeParams, AdCollection) {
    $scope.waiting = true;
    $scope.CSpaceID = $routeParams.CSpaceID;
    $scope.AdCollection = AdCollection.get({cSpaceID: $scope.CSpaceID},
					   function() {$scope.waiting = false});
    $scope.orderReverse = false;
    $scope.orderProp = "AssetID";
}

function CreateAdCtrl($scope, $routeParams, AdCollection, CustomFileReader) {
    $scope.waiting = false;
    $scope.cSpaceID = $routeParams.CSpaceID;
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
	    AdCollection.create({cSpaceID: $routeParams.CSpaceID},
				$scope.ad, function() {
				    window.location = "#/cspaces/" +
					$routeParams.CSpaceID + "/ad";
				});
	}
    }
}

function EditAdCtrl($scope, $routeParams, SingleAd, CustomFileReader) {
    $scope.waiting = true;
    $scope.hasImage = false;
    $scope.cSpaceID = $routeParams.CSpaceID;

    $scope.ad = SingleAd.get({adID: $routeParams.AdID,
			      cSpaceID: $routeParams.CSpaceID}, function() {
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
	    SingleAd.update({cSpaceID: $routeParams.CSpaceID,
			     adID: $routeParams.AdID},
			    $scope.ad, function() {
				window.location =
				    "#/cspaces/" + $routeParams.CSpaceID +
				    "/ad";
			    });
	}
    }

    $scope.del = function() {
	$scope.waiting = true;
	SingleAd.del({cSpaceID: $routeParams.CSpaceID,
		      adID: $routeParams.AdID}, function() {
			  window.location =
			      "#/cspaces/" + $routeParams.CSpaceID +
			      "/ad";
		      });
    }
}

function AdMetricsCtrl($scope, $routeParams, AdMetrics) {
    $scope.CSpaceID = $routeParams.CSpaceID;
    $scope.ctr = "--";
    $scope.impressions = 0;
    $scope.clicks = 0;
    $scope.impressionsSeries = "";
    $scope.clicksSeries = "";
    $scope.metrics =
	AdMetrics.get({adID: $routeParams.AdID,
		       cSpaceID: $routeParams.CSpaceID},
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

/**
 * Asset controllers.
 */

function AssetListCtrl($scope, $routeParams, AssetCollection) {
    $scope.waiting = true;
    $scope.CSpaceID = $routeParams.CSpaceID;
    $scope.AssetCollection = AssetCollection.get({cSpaceID: $scope.CSpaceID},
						 function() {
						     $scope.waiting = false
						 });
    $scope.orderReverse = false;
    $scope.orderProp = "AssetID";
    $scope.clearSearch = function() {
	$scope.query = "";
    }
}

function CreateAssetCtrl($scope, $routeParams, AssetCollection,
			 CustomFileReader) {
    $scope.waiting = false;
    $scope.cSpaceID = $routeParams.CSpaceID;
    $scope.hasImage = false;

    $scope.asset = {};

    $scope.readImageFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.asset.image = result;
		$scope.imageSrc = result;
		$scope.hasImage = true;
            });
    };

    $scope.create = function(newAssetForm) {
	if (newAssetForm.$valid) {
	    $scope.waiting = true;
	    AssetCollection.create({cSpaceID: $routeParams.CSpaceID},
				   $scope.asset, function() {
				       window.location = "#/cspaces/" +
					   $routeParams.CSpaceID + "/asset";
				   });
	}
    }
}

function EditAssetCtrl($scope, $routeParams, SingleAsset, CustomFileReader) {
    $scope.waiting = true;
    $scope.cSpaceID = $routeParams.CSpaceID;

    $scope.asset = SingleAsset.get({assetID: $routeParams.AssetID,
				    cSpaceID: $routeParams.CSpaceID},
				   function() {
				       $scope.waiting = false;
				       $scope.imageSrc =
					   _rewriteS3URL($scope.asset.image);
				   });

    $scope.readImageFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.asset.image = result;
		$scope.imageSrc = result;
            });
    };

    $scope.update = function(AssetForm) {
	if (AssetForm.$valid) {
	    $scope.waiting = true;
	    SingleAsset.update({cSpaceID: $routeParams.CSpaceID,
				assetID: $routeParams.AssetID},
			       $scope.asset, function() {
				   window.location =
				       "#/cspaces/" + $routeParams.CSpaceID +
				       "/asset";
			       });
	}
    }

    $scope.del = function() {
	$scope.waiting = true;
	SingleAsset.del({cSpaceID: $routeParams.CSpaceID,
			 assetID: $routeParams.AssetID}, function() {
			     window.location =
				 "#/cspaces/" + $routeParams.CSpaceID +
				 "/asset";
			 });
    }
}

function AssetMetricsCtrl($scope, $routeParams, AssetMetrics) {
    $scope.CSpaceID = $routeParams.CSpaceID;
    $scope.ctr = "--";
    $scope.impressions = 0;
    $scope.clicks = 0;
    $scope.impressionsSeries = "";
    $scope.clicksSeries = "";
    $scope.metrics =
	AssetMetrics.get({assetID: $routeParams.AssetID,
			  cSpaceID: $routeParams.CSpaceID},
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

/**
 * Account controllers.
 */

function AccountCtrl($scope, $routeParams, Account) {
    $scope.waiting = true;
    $scope.account = Account.get({}, function() {$scope.waiting = false});
    $scope.showCredentials = false;
}

function EditAccountCtrl($scope, $routeParams, Account) {
    $scope.waiting = true;
    $scope.account = Account.get({}, function() {$scope.waiting = false});

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

/**
 * Documentation controller.
 */

function DocsCtrl($scope, $routeParams) {
    $scope.showAPIDocs = false;
    $scope.showUnityPluginDocs = false;
    $scope.showGeneralInformation = false;
}

/**
 * Private functions.
 */

function _rewriteS3URL(url) {
    var a = document.createElement("a");
    a.href = url;
    if (a.host == "cdn.appcrafted.com") {
	return "https://s3.amazonaws.com/cdn.appcrafted.com" + a.pathname;
    } else {
	return url;
    }
}
