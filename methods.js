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

function isDuplicate(item, array) {

	var found = false;
	for (var i = 0; i < array.length; i++) {

		if (array[i] == item) {

			found = true; 

		}

	}

	return found; 

}

function getInfoFromHtml(html) {

	$ = cheerio.load(html);

	var body = $('body').html();
	knwlInstance.init(body);
	var emails = knwlInstance.get('emails');
	for (var i = 0; i < emails.length; i++) {

		if (emails[i].sameAs != null) {

			a_emails.push({'address': emails[i].address, 'preview': emails[i].preview, 'sameAs': emails[i].sameAs});

		} else {

			a_emails.push({'address': emails[i].address, 'preview': emails[i].preview});

		}

	}
	
	$('a').each(function(){
	
		knwlInstance.init($(this).text()+" "+$(this).attr("href"));
		var links = knwlInstance.get('links');
		if (links.length > 0) {

			for (var i = 0; i < links.length; i++) {
				if (!isDuplicate(links[0].link, a_links)) {
					a_links.push(links[0].link);
				}
			}

		}
	
	});

}
function getLink($, website, regex) {

	var body = $("body").html();
	var a = $("a");
	for (var i = 0; i < a.length; i++) {

		if (a[i].attribs.href != undefined) {
			if (new RegExp(regex).test(a[i].attribs.href.toLowerCase())) {

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
			var contactUs = getLink($,url,".*contact.*");
			if (contactUs != null) {

				request(contactUs, function(error, response, html) {

					if (error) {

						throw error; 

					}

					getInfoFromHtml(html);

				});

			}
			//try team page
			var team = getLink($,url,".*team.*");
			if (team != null) {

				request(team, function(error, response, html) {

					if (error) {

						throw error; 

					}

					getInfoFromHtml(html);

				});

			}


		});

	},
	checkLinks: function() {

		//todo: open twitter, facebook and linkedin links and get info from them 
		

		

	}
}