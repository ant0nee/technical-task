const methods = require('./methods.js');
const cheerio = require('cheerio');
const Knwl = require("knwl.js");
const knwlInstance = new Knwl('english');
const request = require('request');

try {
	
	//get email address from arguments
	var emailAddress = methods.getEmail(process.argv[2]); 
	//get information from email.

	var website = methods.getWebsite(emailAddress);
	//loop until variable update

	request(website, function(error, response, html) {

		if (error) {

			throw error; 

		}

		//get relevent information 
		var $ = cheerio.load(html);

		var body = $("body").html(); 

		knwlInstance.init(body); 

		console.log(knwlInstance.get('emails'));

		//find contact us link 

		var contactPage = methods.getContactUsLink($, website);

		//open link
		request(contactPage, function(error, response, html) {

			$ = cheerio.load(html);

			body = $("body").html(); 
			
			knwlInstance.init(body); 
			console.log(knwlInstance.get('emails'));

		}); 

	});
	
	 
	
	

} catch (error) {

	console.log(error);

}