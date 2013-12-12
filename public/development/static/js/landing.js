$(document).ready(function() {
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
    // Collect and send all the info to the server.
    $("#send-info, #send-info-2").click(function() {
	var email = $("#email-input").val() || "Not provided";
	var name = $("#comment-name").val() || "Not provided";
	var comment = $("#comment").val() || "Not provided";
	$.ajax({
	    type: "POST",
	    url: "/email",
	    data: {"email": email,
		   "name": name,
		   "comment": comment}
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
