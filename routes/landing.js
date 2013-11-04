/**
 * A collection of server interactions to use with the landing page.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

// Collect email, role, and comment.
exports.collectEmail = function(request, response) {
    var db = response.app.get("db");
    var email = request.body.email || "Not provided";
    var role = request.body.role || "Not provided";
    var comment = request.body.comment || "Not provided";
    var name = request.body.name || "Not provided";
    var params = {
	"TableName": response.app.get("email_table"),
	"Item": {
	    "name": {
		"S": name
	    },
	    "email": {
		"S": email
	    },
	    "role": {
		"S": role
	    },
	    "comment": {
		"S": comment
	    }
	}
    };
    db.putItem(params, function(err, data) {
	if (err) {
	    response.send({"status": 500,
			   "message": "Error! Please try again."});
	} else {
	    response.send({"status": 200,
			   "message": "Success"});
	}
    });
};
