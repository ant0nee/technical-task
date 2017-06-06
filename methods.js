module.exports = {

	//get email from arguments. return email address as a string
	getEmail: function(args) {

		if (!args) {

			throw "Email argument not given. \nUsage: node code <email-address>";

		}

		var email = args; 

		if (!new RegExp("^.+@.+\\..+$").test(email)) {

			throw "Argument \""+email+"\" is not an email. \nUsage: node code <email-address>";

		}

		return email; 

	},

	//get relevent webpage from email address.
	getWebsite: function(email) {

		//get domain from the email
		var website = email.replace(/^.+@/,"");
		return "http://www."+website; 

	},

	getContactUsLink: function($, website) {

		var body = $("body").html();
		var a = $("a");
		for (var i = 0; i < a.length; i++) {

			if (new RegExp(".*contact.*").test(a[i].attribs.href.toLowerCase())) {

				var contact = a[i].attribs.href;

				if (new RegExp("^https?://.+$").test(contact)) {

					return contact;

				} else {

					if (!new RegExp("^\\/.+$").test(contact)) {

						contact = "/"+contact; 

					}

					return website + contact; 

				}

			}

		}
	}
}