$(document).ready(function() {
    var latLng = new google.maps.LatLng(47.615561,-122.353688);
    var mapOptions = {
	scrollwheel: false,
        center: latLng,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true
    };
    var styles = [
	{
	    stylers: [
		{ saturation: -100 }
	    ]
	}
    ];
    var map = new google.maps.Map(document.getElementById("map"), mapOptions);
    map.setOptions({styles: styles});
    var marker = new google.maps.Marker({
	position: latLng,
	map: map
    });
    // Regex email validator.
    var isEmail = function(email) {
	var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	return regex.test(email);
    };
    // The Fader object manages transitions between the elements specified by
    // jQuery selectors given to the constructor.
    var fader = new Fader([$("#tagline-1"), $("#tagline-2"), $("#tagline-3"), $("#tagline-4")],
			  [$("#nav-1"), $("#nav-2"), $("#nav-3"), $("#nav-4")],
			  7000, 400, 200);
    fader.start();
    // Override the Fader when one of the navigation elements is clicked. The
    // Fader will also be placed into "manual-mode".
    $(".fader-nav").click(function() {
	fader.show($(this).attr('data-index'));
    });
    // Scroll animation on href="#...".
    $('a[href^="#"]').on("click",function (e) {
	e.preventDefault();
	var target = this.hash,
	$target = $(target);
	$("html, body").stop().animate({
	    "scrollTop": $target.offset().top
	}, 200, "swing", function () {
	    window.location.hash = target;
	});
    });
    // Collect and send all the info to the server.
    $("#send-info, #send-info-2").click(function() {
	var email = $("#email-input").val() || "Not provided";
	var name = $("#comment-name").val() || "Not provided";
	$.ajax({
	    type: "POST",
	    url: "/email",
	    data: {"email": email,
		   "name": name}
	});
    });
    // Send the contact form and manage the alerts.
    $("#contact-send").click(function() {
	var email = $("#contact-email").val();
	if (isEmail(email)) {
	    var name = $("#contact-name").val() || "Not provided";
	    var comment = $("#contact-comment").val() || "Not provided";
	    $(this).addClass("email-sending");
	    $(this).text("Sending...");
	    $(this).prop("disabled", true);
	    $.ajax({
		type: "POST",
		url: "/email",
		data: {"email": email,
		       "name": name,
		       "comment": comment},
		success: function(data) {
		    $("#contact-send").prop("disabled", false);
		    $("#contact-send").text("Send");
		    $("#contact-send").removeClass("email-sending");
		    if (data.status != 200) {
			$("#contact-error-text").text(data.message);
			$("#contact-error").removeClass("hide");
		    } else {
			$("#contact-error").addClass("hide");
			$("#contact-success").removeClass("hide");
			$("#contact-email").val("");
			$("#contact-name").val("");
			$("#contact-comment").val("");
		    }
		}
	    });
	} else {
	    $("#contact-error-text").text("Please enter a valid email address.");
	    $("#contact-error").removeClass("hide");
	}
    });
    $("#contact-error > .close").click(function() {
	$("#contact-error").addClass("hide");
    });
    $("#contact-success > .close").click(function() {
	$("#contact-success").addClass("hide");
    });
});
function Fader($elementArray, $navigationArray, period, fadeOutDur, fadeInDur) {
    this.elements   = $elementArray;
    this.nav        = $navigationArray;
    this.period     = period;
    this.fadeOutDur = fadeOutDur;
    this.fadeInDur  = fadeInDur;
    this.index      = 0;
    this.queue      = {};
    // Hide all elements except the first one.
    for (var i = 1; i < this.elements.length; i++) {
	this.elements[i].hide();
    }
    if (this.nav.length > 0) {
	this.nav[0].addClass("fader-nav-active");
    }
}
Fader.prototype.start = function() {
    this.queue = setTimeout(function() {
	this.elements[this.index].fadeOut(this.fadeOutDur, function() {
	    this.nav[this.index].removeClass("fader-nav-active");
	    this.index = (this.index + 1) % this.elements.length;
	    this.nav[this.index].addClass("fader-nav-active");
	    this.elements[this.index].fadeIn(this.fadeInDur);
	    this.start();
	}.bind(this));
    }.bind(this), this.period);
};
Fader.prototype.stop = function() {
    clearTimeout(this.queue);
};
Fader.prototype.show = function(index) {
    if (index >= 0 && index < this.elements.length && index != this.index) {
	this.stop();
	this.elements[this.index].fadeOut(this.fadeOutDur, function() {
	    this.nav[this.index].removeClass("fader-nav-active");
	    this.nav[index].addClass("fader-nav-active");
	    this.index = index;
	    this.elements[index].fadeIn(this.fadeInDur);
	}.bind(this));
    }
};
