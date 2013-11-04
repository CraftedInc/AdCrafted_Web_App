$(document).ready(function() {
    $(".img-team").hover(
	function() {
	    $(this).stop();
	    $(this).animate({margin: "-5px 0 5px 0"}, 150);
	},
	function() {
	    $(this).stop();
	    $(this).animate({margin: "0"}, 150);
	}
    );
    // Regex email validator.
    var isEmail = function(email) {
	var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	return regex.test(email);
    };
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
    // Validate the email, and prompt the user for more information.
    $("#email-send").click(function() {
	var email = $("#email-input").val();
	if (isEmail(email)) {
	    $("#comment-modal").modal();
	} else {
	    $("#invalid-email").fadeIn();
	}
    });
    // Fade out the error message on focus.
    $("#email-input").focus(function() {
	$("#invalid-email").fadeOut();
    });
    // Fade out the error message when the input is changed. The enter key
    // triggers a click.
    $("#email-input").keyup(function(event) {
        if (event.keyCode != 13) {
	    $("#invalid-email").fadeOut();
        } else {
	    $("#email-send").click();
	}
    });
    // Collect and send all the info to the server.
    $("#send-info").click(function() {
	var email = $("#email-input").val() || "Not provided";
	var developer = $("#developer-checkbox").prop("checked");
	var advertiser = $("#advertiser-checkbox").prop("checked");
	var role = developer ? advertiser ? "Both" : "Developer" :
	advertiser ? "Advertiser" : "Not provided";
	var comment = $("#comment").val() || "Not provided";
	$.ajax({
	    type: "POST",
	    url: "/email",
	    data: {"email": email,
		   "role": role,
		   "comment": comment},
	    success: function(data) {
		if (data.status != 200) {
		    $("#server-message").text(data.message);
		    $("#server-message").fadeIn();
		} else {
		    $("#server-message").fadeOut();
		    $("#incentive").fadeOut();
		    $("#email-input-wrapper").fadeOut(400, function() {
			$("#thank-you").fadeIn(10, function() {
			    $("#thank-you").fadeOut(3000);
			});
		    });
		}
	    }
	});
    });
    // Send the contact form and manage the alerts.
    $("#contact-send").click(function() {
	var email = $("#contact-email").val();
	if (isEmail(email)) {
	    var name = $("#contact-name").val() || "Not provided";
	    var comment = $("#contact-comment").val() || "Not provided";
	    $("#contact-send").text("Sending...");
	    $("#contact-send").prop("disabled", true);
	    $.ajax({
		type: "POST",
		url: "/email",
		data: {"email": email,
		       "name": name,
		       "comment": comment},
		success: function(data) {
		    $("#contact-send").prop("disabled", false);
		    $("#contact-send").text("Send");
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
