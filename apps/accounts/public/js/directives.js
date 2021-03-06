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
