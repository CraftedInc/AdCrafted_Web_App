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
		window.location = "#/assets";
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
				     window.location = "#/assets";
				 });
	}
    }

    $scope.del = function() {
	$scope.waiting = true;
	SingleCSpace.del({cSpaceID: $routeParams.CSpaceID}, function() {
	    window.location = "#/assets";
	});
    }
}

/**
 * Asset controllers.
 */

function AssetListCtrl($scope, $routeParams, AssetCollection, SingleCSpace) {
    $scope.waitingCSpace = true;
    $scope.waitingAsset = true;
    $scope.CSpaceID = $routeParams.CSpaceID;
    $scope.attributesToShow = [];
    $scope.cSpace =
	SingleCSpace.get({cSpaceID: $routeParams.CSpaceID}, function() {
	    $scope.waitingCSpace = false;
	    $scope.imageSrc = $scope.cSpace.image;
	    $scope.hasImage = $scope.cSpace.image != "null";
	});
    $scope.AssetCollection = AssetCollection.get({cSpaceID: $scope.CSpaceID},
						 function() {
						     $scope.waitingAsset = false;
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
    $scope.assetIDNotUnique = false;
    $scope.errorMessage = null;

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
	$scope.errorMessage = null;
	if (newAssetForm.$valid) {
	    $scope.attributes.forEach(function(attribute) {
		$scope.asset[attribute["Name"]]= {
		    "Type": attribute["Type"],
		    "Value": attribute["Value"]
		};
	    });
	    $scope.waiting = true;
	    AssetCollection.create({cSpaceID: $routeParams.CSpaceID},
				   $scope.asset, function(response) {
				       window.location = "#/assets/" +
					   $routeParams.CSpaceID;
				   }, function(error) {
				       if (!!error.data && error.data.message ==
					   "AssetID Not Unique") {
					   $scope.assetIDNotUnique = true;
				       } else if (!!error.data) {
					   if (error.data.message ==
					       "File Not Base64-Encoded") {
					       $scope.errorMessage =
						   "File upload failed";
					   } else {
					       $scope.errorMessage =
						   error.data.message;
					   }
				       }
				       $scope.waiting = false;
				   });
	}
    }
}

function EditAssetCtrl($scope, $routeParams, SingleAsset, CustomFileReader) {
    $scope.waiting = true;
    $scope.submitted = false;
    $scope.cSpaceID = $routeParams.CSpaceID;
    $scope.errorMessage = null;

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
	$scope.errorMessage = null;
	if (EditAssetForm.$valid) {
	    $scope.waiting = true;
	    $scope.attributes.forEach(function(attribute) {
		// Check that the attribute is not an existing file or image,
		// which is manifested by a URL referencing a resource on the
		// Appcrafted CDN.
		if ((attribute["Type"] != "IMAGE" &&
		     attribute["Type"] != "FILE") ||
		    !isValidURL(attribute["Value"])) {
		    $scope.newAsset[attribute["Name"]]= {
			"Type": attribute["Type"],
			"Value": attribute["Value"],
			"Action": "UPDATE"
		    };
		}
	    });
	    $scope.attributesToRemove.forEach(function(attribute) {
		$scope.newAsset[attribute["Name"]]= {
		    "Action": "DELETE"
		};
	    });
	    SingleAsset.update({cSpaceID: $routeParams.CSpaceID,
				assetID: $routeParams.AssetID},
			       $scope.newAsset, function(response) {
				   window.location =
				       "#/assets/" + $routeParams.CSpaceID;
			       }, function(error) {
				   if (!!error.data) {
				       if (error.data.message ==
					   "File Not Base64-Encoded") {
					   $scope.errorMessage =
					       "File upload failed";
				       } else {
					   $scope.errorMessage =
					       error.data.message;
				       }
				   }
				   $scope.waiting = false;
			       });
	}
    }

    $scope.del = function() {
	$scope.waiting = true;
	SingleAsset.del({cSpaceID: $routeParams.CSpaceID,
			 assetID: $routeParams.AssetID}, function() {
			     window.location =
				 "#/assets/" + $routeParams.CSpaceID;
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
    $scope.showJavaScriptPluginDocs = false;
    $scope.showGeneralInformation = false;
}

/**
 * Downloads controller.
 */

function DownloadsCtrl($scope) {
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

function isValidURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+
			     '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
			     '((\\d{1,3}\\.){3}\\d{1,3}))'+
			     '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
			     '(\\?[;&a-z\\d%_.~+=-]*)?'+
			     '(\\#[-a-z\\d_]*)?$','i');
    if(!pattern.test(str)) {
	return false;
    } else {
	return true;
    }
}
