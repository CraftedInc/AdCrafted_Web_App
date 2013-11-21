/**
 * A collection of server interactions to use with the landing page.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

var config = require("./../config");
var jade   = require("jade");
var fs     = require("fs");

// Construct the contact email template.
var contactEmailTemplate =
    jade.compile(fs.readFileSync(__dirname + "/../views/emails/contact.jade"));

// Collect email, role, and comment.
exports.collectEmail = function(request, response) {
    var ses = response.app.get("ses");
    var email = request.body.email || "Not provided";
    var role = request.body.role || "Not provided";
    var comment = request.body.comment || "Not provided";
    var name = request.body.name || "Not provided";
    var html = contactEmailTemplate(
	{name: name,
	 email: email,
	 comment: comment,
	 role: role}
    );
    var params = {
	"Source": "AdCrafted Notifications <james@adcrafted.com>",//config.NOTIFICATIONS_EMAIL,
	"Destination": {
	    "ToAddresses": config.ADMIN_EMAILS
	},
	"Message": {
	    "Subject": {
		"Data": "[NOTIFICATION] Contact Form Submission"
	    },
	    "Body": {
		"Html": {
		    "Data": html
		}
	    }
	}
    };
    if (request.body.email) {
	params["ReplyToAddresses"] = [request.body.email];
    }
    ses.sendEmail(params, function(err, data) {
	if (err) {
	    console.log(err);
	    response.send({"status": 500,
			   "message": "Error! Please try again."});
	} else {
	    response.send({"status": 200,
			   "message": "Success"});
	}
    });
};
