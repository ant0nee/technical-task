const request = require('request');
const Knwl = require("knwl.js");
const knwlInstance = new Knwl('english');
const cheerio = require('cheerio');
var a_emails = []; 
var a_phones = [];
var a_places = [];
var a_links = []; 
var a_times = []; 
var a_dates = []; 
var $; 

function getInfoFromHtml(html) {

	$ = cheerio.load(html);

	var body = $('body').html();
	knwlInstance.init(body);
	var emails = knwlInstance.get('emails');

	a_emails.push(emails);
	knwlInstance.init(body);
	var phones = knwlInstance.get('phones');

	a_phones.push(phones);
	knwlInstance.init(body);
	var places = knwlInstance.get('places');

	a_places.push(places);
	knwlInstance.init(body);
	var links = knwlInstance.get('links');
	
	a_links.push(links);
	knwlInstance.init(body);
	var times = knwlInstance.get('times');
	
	a_times.push(times);
	knwlInstance.init(body);
	var dates = knwlInstance.get('dates');
	
	a_dates.push(dates);
	
	

}
function getContactUsLink($, website) {

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

	return null; 

}

module.exports = {

	getEmails: function() {

		return a_emails; 

	},
	getPhones: function() {

		return a_phones; 

	},
	getPlaces: function() {

		return a_places; 

	},
	getLinks: function() {

		return a_links; 

	},
	getTimes: function() {

		return a_times; 

	},
	getDates: function() {

		return a_dates; 

	},

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

	scrapeWebsite: function(url) {

		request(url, function(error, response, html) {

			if (error) {

				throw error; 

			}

			//get relevent information 
			getInfoFromHtml(html);

			//try contact us page
			var contactUs = getContactUsLink($,url);
			if (contactUs != null) {

				request(contactUs, function(error, response, html) {

					if (error) {

						throw error; 

					}

					getInfoFromHtml(html);

				});

			}

		});

	}
}