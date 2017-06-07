const methods = require('./methods.js');

try {
	
	//get email address from arguments
	var emailAddress = methods.getEmail(process.argv[2]);
	//get information from email.
	var website = methods.getWebsite(emailAddress);
	//get info from website and contact page
	methods.scrapeWebsite(website); 
	
	var getEmails = function() {

		console.log("\n");
		console.log(methods.getEmails());
		//console.log(methods.getPhones());
		//console.log(methods.getPlaces());
		console.log(methods.getLinks());
		//console.log(methods.getTimes());
		//console.log(methods.getDates());

	}
	setInterval(function() {getEmails()},1000);

} catch (error) {

	console.log(error);

}