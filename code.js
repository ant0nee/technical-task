const methods = require('./methods.js');
const express = require('express');
const app = express();
const cheerio = require('cheerio');
const Knwl = require("knwl.js");
const knwlInstance = new Knwl('english');

try {
	
	//get email address from arguments
	var emailAddress = methods.getEmail(process.argv[2]);
	//get information from email.
	var website = methods.getWebsite(emailAddress);
	//get info from website and contact page
	methods.scrapeWebsite(website); 

	var request = require('request');

	//todo: individually extract data from twitter, facebook and linkedin. (currently not working)
	var links = methods.getLinks(); 
	setTimeout(function() {

		for (var i = 0; i < links.length; i++) {
			if (new RegExp("^https?:\\/\\/.*(facebook|twitter|linkedin).+$").test(links[i])) {
				request(links[i], function(error, res, html) {

					console.log(links[i]);
					$ = cheerio.load(html);
					if (new RegExp("^https?:\\/\\/.*twitter.+$").test(links[i])) {
						var name = $("a.ProfileHeaderCard-nameLink").text();
						console.log(currentLink+ ": "+name);
					}

				});

			}
		}
	},5000);

	/*var getEmails = function() {

		console.log("\n");
		console.log(methods.getEmails());
		//console.log(methods.getPhones());
		//console.log(methods.getPlaces());
		console.log(methods.getLinks());
		//console.log(methods.getTimes());
		//console.log(methods.getDates());

	}
	setInterval(function() {getEmails()},1000);*/

} catch (error) {

	console.log(error);

}

