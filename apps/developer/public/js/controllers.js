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
    $scope.submitted = false;

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
	$scope.submitted = true;
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
    $scope.submitted = false;
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
	$scope.submitted = true;
	if (CSpaceForm.$valid) {
	    $scope.waiting = true;
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
 * Asset controllers.
 */

function AssetListCtrl($scope, $routeParams, AssetCollection) {
    $scope.waiting = true;
    $scope.CSpaceID = $routeParams.CSpaceID;
    $scope.attributesToShow = [];
    $scope.AssetCollection = AssetCollection.get({cSpaceID: $scope.CSpaceID},
						 function() {
						     $scope.waiting = false;
						     var assets = $scope.AssetCollection.Assets;
						     for (var i = 0; i < assets.length; i++) {
							 for (var attr in assets[i]) {
							     if (attr != "UserID" &&
								 attr != "AssetID" &&
								 attr != "CSpaceID" &&
								 attr != "AssetCreatedDate") {
								 if (!contains($scope.attributesToShow, attr)) {
								     $scope.attributesToShow.push(attr);
								 }
							     }
							 }
						     }
						     for (var i = 0; i < 4; i++) {
							 // Ensure that attributesToShow.length >= 4.
							 $scope.attributesToShow.push(undefined);
						     }
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
    $scope.submitted = false;

    $scope.attributes = [{"Type": "STRING"}];
    $scope.asset = {};

    $scope.addAttribute = function() {
	$scope.attributes.push({"Type": "STRING"});
    };

    $scope.removeAttribute = function(index) {
	if (index > -1) {
	    $scope.attributes.splice(index, 1);
	}
    };

    $scope.readFile = function(index) {
        CustomFileReader.readAsDataUrl(this.file, $scope)
            .then(function(result) {
		$scope.attributes[index]["Value"] = result;
            });
    };

    $scope.create = function(newAssetForm) {
	$scope.submitted = true;
	if (newAssetForm.$valid) {
	    $scope.attributes.forEach(function(attribute) {
		$scope.asset[attribute["Name"]]= {
		    "Type": attribute["Type"],
		    "Value": attribute["Value"]
		};
	    });
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
    $scope.submitted = false;
    $scope.cSpaceID = $routeParams.CSpaceID;

    $scope.attributes = [];
    $scope.attributesToRemove = [];
    $scope.newAsset = {};

    $scope.oldAsset =
	SingleAsset.get({assetID: $routeParams.AssetID,
			 cSpaceID: $routeParams.CSpaceID},
			function() {
			    for (attr in $scope.oldAsset) {
				if ($scope.oldAsset.hasOwnProperty(attr) &&
				    attr !== "UserID" && attr !== "AssetID" &&
				    attr !== "AssetCreatedDate" &&
				    attr !== "CSpaceID") {
				    $scope.oldAsset[attr]["Name"] = attr;
				    // Rewrite image URLs.
				    if ($scope.oldAsset[attr]["Type"] ==
					"IMAGE") {
					$scope.oldAsset[attr]["ImageSrc"] =
					    _rewriteS3URL(
						$scope.oldAsset[attr]["Value"]
					    );
				    }
				    $scope.attributes.push($scope.oldAsset[attr]);
				}
			    }
			    $scope.waiting = false;
			});

    $scope.addAttribute = function() {
	$scope.attributes.push({"Type": "STRING"});
    };

    $scope.removeAttribute = function(index) {
	if (index > -1) {
	    $scope.attributesToRemove.push(
		$scope.attributes[index]);
	    $scope.attributes.splice(index, 1);
	}
    };

    $scope.readFile = function(index) {
        CustomFileReader.readAsDataUrl(this.file, $scope)
            .then(function(result) {
		// Set the rewritten image src to null, thus forcing the new
		// on to display.
		$scope.attributes[index]["ImageSrc"] = null;
		$scope.attributes[index]["Value"] = result;
            });
    };

    $scope.update = function(EditAssetForm) {
	$scope.submitted = true;
	if (EditAssetForm.$valid) {
	    $scope.waiting = true;
	    $scope.attributes.forEach(function(attribute) {
		$scope.newAsset[attribute["Name"]]= {
		    "Type": attribute["Type"],
		    "Value": attribute["Value"],
		    "Action": "UPDATE"
		};
	    });
	    $scope.attributesToRemove.forEach(function(attribute) {
		$scope.newAsset[attribute["Name"]]= {
		    "Action": "DELETE"
		};
	    });
	    SingleAsset.update({cSpaceID: $routeParams.CSpaceID,
				assetID: $routeParams.AssetID},
			       $scope.newAsset, function() {
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
    $scope.submitted = false;
    $scope.account = Account.get({}, function() {$scope.waiting = false});

    $scope.update = function(AccountForm) {
	$scope.submitted = true;
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

function contains(a, obj) {
    var i = a.length;
    while (i--) {
	if (a[i] === obj) {
            return true;
	}
    }
    return false;
}
