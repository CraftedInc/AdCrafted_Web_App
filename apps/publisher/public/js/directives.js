var customDirectives = angular.module("customDirectives", []);

customDirectives.directive("fileInput", function($parse) {
    return {
        restrict: "A",
        template: "<input type='file' />",
        replace: true,
        link: function (scope, element, attrs) {
            var modelGet = $parse(attrs.fileInput);
            var modelSet = modelGet.assign;
            var onChange = $parse(attrs.onChange);

            var updateModel = function () {
                scope.$apply(function () {
                    modelSet(scope, element[0].files[0]);
                    onChange(scope);
                });                    
            };
            element.bind("change", updateModel);
        }
    };
});

customDirectives.directive("imageDrop", function ($parse) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            var expression = attrs.imageDrop;
            var accessor = $parse(expression);
            var onChange = $parse(attrs.onChange);

            var onDragOver = function (e) {
                e.preventDefault();
                element.addClass("drag-over");
            };

            var onDragEnd = function (e) {
                e.preventDefault();
                element.removeClass("drag-over");
            };

            var updateModel = function (file) {
                scope.$apply(function () {
                    accessor.assign(scope, file);
                    onChange(scope);
                });                    
            };

            element.bind("dragover", onDragOver)
                .bind("dragleave", onDragEnd)
                .bind("drop", function (e) {
                    element.removeClass("draggable");
                    element.removeClass("dropzone");
                    onDragEnd(e);
                    updateModel(e.dataTransfer.files[0]);
                });
        }
    };
});

customDirectives.directive("fallbackSrc", function() {
    return {
	link: function postLink(scope, elem, attrs) {
	    elem.bind("error", function() {
		angular.element(this).attr("src", attrs.fallbackSrc);
	    });
	}
    };
});

customDirectives.directive("barChart", function() {
    return {
	restrict: "A",
	link: function (scope, element, attrs) {
	    var chart = new google.visualization.BarChart(element[0]);
	    var options = {
		theme: "maximized",
		height: 80,
		backgroundColor: {fill: "transparent"},
		vAxis: {textPosition: "none"},
		hAxis: {textStyle: {color: "#999"},
			gridlines: {color: "#999"},
			baselineColor: "#999"},
		legend: {textStyle: {color: "#999"}},
		bar: {groupWidth: "25"},
		colors: ["rgb(46, 105, 180)", "rgb(223, 49, 49)"],
		tooltip: {trigger: "none"}
	    };
	    // Redraw the graph when the scope gets the metrics data.
	    scope.$watch("clicks", function() {
		var impressions = scope.impressions ? scope.impressions : 0;
		var clicks = scope.clicks ? scope.clicks : 0;
		var data = new google.visualization.DataTable();
		data.addColumn("string", "Total");
		data.addColumn("number", "Impressions");
		data.addColumn("number", "Clicks");
		data.addRows([
		    ["Total", impressions, clicks],
		]);
		chart.draw(data, options);
	    });
	}
    };
});

customDirectives.directive("impressionsLineChart", function() {
    return {
	restrict: "A",
	link: function (scope, element, attrs) {
	    scope.$watch("impressionsSeries", function() {
		var chart = new Dygraph(
		    element[0],
		    "Date,Impressions\n" + scope.impressionsSeries,
		    {drawGrid: false,
		     fillGraph: true,
		     axisLabelColor: "#999",
		     strokeWidth: "2.0",
		     colors: ["rgb(46, 105, 180)"]}
		);
	    });
	}
    };
});

customDirectives.directive("clicksLineChart", function() {
    return {
	restrict: "A",
	link: function (scope, element, attrs) {
	    scope.$watch("clicksSeries", function() {
		var chart = new Dygraph(
		    element[0],
		    "Date,Clicks\n" + scope.clicksSeries,
		    {drawGrid: false,
		     fillGraph: true,
		     axisLabelColor: "#999",
		     strokeWidth: "2.0",
		     colors: ["rgb(223, 49, 49)"]}
		);
	    });
	}
    };
});

customDirectives.directive("confirmDelete", function($compile, $location) {
    return {
	restrict: "A",
	link: function(scope, element, attrs) {
            element.bind("click", function(event) {
		element.after($compile('<button class="btn btn-danger"' +
				       ' ng-click="del()"><strong>Yes' +
				       '</strong></button>')(scope));
		element.after('<p style="display: inline; margin: 0 10px">' +
			      '<strong>Are you sure?</strong></p>')
		element.remove();
	    });
        }
    }
});
