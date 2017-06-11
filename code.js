//variables
var strEmail; 
var strWebsiteFromEmail; 
var rgFinalResults = []; 
var rgScrapedEmails = []; 
//dependencies 
const REQUEST = require('request');
const CHEERIO = require('cheerio');
const KNWL = require('knwl.js');
const KNWLI = new KNWL();
const ASYNC = require('async');
//constants
const SOCIAL_REGEX = new RegExp("^.*(facebook|twitter|linkedin|plus\.google).*$");

try {
	//get email from args
	if (!process.argv[2]) {
		throw "Email argument not given. \nUsage: node code <email-address>";
	}

	strEmail = process.argv[2]; 

	if (!new RegExp("^.+@.+\\..+$").test(strEmail)) {
		throw "Argument \""+strEmail+"\" is not an email. \nUsage: node code <email-address>";
	}

	//get website linked to email 
	strWebsiteFromEmail = "http://www."+strEmail.replace(/^.+@/,"");

	//get data from website

	fnGetHtml(strWebsiteFromEmail, function(strHtml){

		fnScrape(strHtml);
		//get links on website
		var $ = CHEERIO.load(strHtml);
		var rgAsync = []; 
		$('a').each(function(){

			var strHref = $(this).attr("href");
			var strFullLink = fnGetFullLink(strWebsiteFromEmail, strHref);
			//find contact us link and team/about us and social media links and add them to array 
			if (new RegExp("^.*(contact|about|team).*$").test(strHref) || SOCIAL_REGEX.test(strHref)) {
				
				//if not a social link
				if (!SOCIAL_REGEX.test(strFullLink)) {
					//put all relevent (social) links into array from non social urls 
					rgAsync.push(function(fnCallback) {
						fnGetHtml(strFullLink, function(strHtml){

							var $ = CHEERIO.load(strHtml);
							var rgList = []; 
							$('a').each(function(){

								var strHref = $(this).attr("href");
								if (SOCIAL_REGEX.test(strHref)) {
									
									rgList.push(strHref);
									
								}

							}); 

							fnCallback(null, [rgList, strHtml]);

						}); 
					}); 

				} 
							

			}


		});

		//wait until links are opened
		ASYNC.parallel(rgAsync, function(error, rgResults){

			var rgAsyncHtml = [];
			var rgDone = [];

			//add them to the rgVisitNext array 
			for (var iResult in rgResults) {
				
				//todo: implement scrape function
				fnScrape(rgResults[iResult][1]);

				for (var iLink in rgResults[iResult][0]) {

					if (fnValidUrl(rgResults[iResult][0][iLink])) {

						if (!fnInArray(rgResults[iResult][0][iLink],rgDone)) {
							rgDone.push(rgResults[iResult][0][iLink]);
							(function(strLink) {
								rgAsyncHtml.push(function(fnCallback) {

									(function(strLink) {fnGetHtml(strLink, function(strHtml) {

										fnCallback(null, [strLink,strHtml]);

									})})(strLink);
									
								});
							})(rgResults[iResult][0][iLink]);
						}

					}

				}
			}

			//populate output
			ASYNC.parallel(rgAsyncHtml, function(error, rgHtml) {

				for (var iHtml in rgHtml) {
					var $ = CHEERIO.load(rgHtml[iHtml][1]);
					if (new RegExp("^.*twitter.*$").test(rgHtml[iHtml][0])) {
						var strName = $("a.ProfileHeaderCard-nameLink").text().toUpperCase();
						var iFound = fnFindNameInFinalResults(strName); 
						var strPicture = $('img.ProfileAvatar-image').attr("src");
						var strLocation = $('div.ProfileHeaderCard div.ProfileHeaderCard-location').text().replace(/[\s\n]+/g,"");
						var strUrl = $('div.ProfileHeaderCard div.ProfileHeaderCard-url').text().replace(/[\s\n]+/g,"");
						var strShortUrl = $('div.ProfileHeaderCard div.ProfileHeaderCard-url').children().last().children().last().attr("href");
						var strJoinDate = $('div.ProfileHeaderCard ProfileHeaderCard-joinDate').text().replace(/[\s\n]+/g,"");
						var strBirthDay = $('div.ProfileHeaderCard ProfileHeaderCard-birthdate').text().replace(/[\s\n]+/g,"");
						var rgData = {
							location: strLocation,
							profilePicture: strPicture, 
							url: {text: strUrl, short: strShortUrl},
							joinDate: strJoinDate,
							birthDay: strBirthDay
						};
						if (iFound != -1) {
							rgFinalResults[ifound].links.push(rgHtml[iHtml][0]);
							rgFinalResults[iFound].data.push(rgData);
						} else {
							rgFinalResults.push(JSON.parse("{\"name\":\""+strName+"\", \"from\":\"twitter\", \"links\":[\""+rgHtml[iHtml][0]+"\"], \"twitterData\":null}"));
							rgFinalResults[rgFinalResults.length-1].twitterData = rgData;
						}
					} else if (new RegExp("^.*plus\.google.*$").test(rgHtml[iHtml][0])) {

						var iFound = fnFindFrom("google+");
						if (iFound != -1) {

							 rgFinalResults[iFound].links.push(rgHtml[iHtml][0]);

						} else {

							rgFinalResults.push(JSON.parse("{\"from\":\"google+\",\"links\":[\""+rgHtml[iHtml][0]+"\"]}"));
							
						}

					} else if (new RegExp("^.*linkedin.*$").test(rgHtml[iHtml][0])) {

						var iFound = fnFindFrom("linkedin");
						if (iFound != -1) {

							 rgFinalResults[iFound].links.push(rgHtml[iHtml][0]);

						} else {

							rgFinalResults.push(JSON.parse("{\"from\":\"linkedin\",\"links\":[\""+rgHtml[iHtml][0]+"\"]}"));
							
						}
						
					} else if (new RegExp("^.*facebook.*$").test(rgHtml[iHtml][0])) {

						var iFound = fnFindFrom("facebook");
						if (iFound != -1) {

							 rgFinalResults[iFound].links.push(rgHtml[iHtml][0]);

						} else {

							rgFinalResults.push(JSON.parse("{\"from\":\"facebook\",\"links\":[\""+rgHtml[iHtml][0]+"\"]}"));
							
						}

					} 

				}

				for (var iItem in rgFinalResults) {

					for (var iEmail in rgScrapedEmails) {
						if (rgFinalResults[iItem].name != null) {
							if (fnSimilar(rgFinalResults[iItem].name, rgScrapedEmails[iEmail].replace(/@.+$/,""))) {

								rgFinalResults[iItem].email = rgScrapedEmails[iEmail];
								rgScrapedEmails[iEmail] = null; 

							} 
						}
					}

				}

				for (var iEmail in rgScrapedEmails) {

					if (rgScrapedEmails[iEmail] != null) {

						if (rgFinalResults.otherEmails == null || rgFinalResults.otherEmails == undefined) {
							rgFinalResults.otherEmails = []; 
						}

						rgFinalResults.otherEmails.push(rgScrapedEmails[iEmail]); 
					}

				}
				
				console.log(JSON.stringify(rgFinalResults, null, 4));

			});

		}); 


	});

	
} catch (e) {

	console.log(e);

}

//functions

function fnScrape(strHtml) {

	//todo: implement 
	KNWLI.init(strHtml);
	var rgEmails = KNWLI.get('emails'); 
	for (var iEmail in rgEmails) {

		if (!fnInArray(rgEmails[iEmail].address, rgScrapedEmails)) {

			rgScrapedEmails.push(rgEmails[iEmail].address);

		}

	}

}

function fnSimilar(str1, str2) {

	var confidence = 0; 
	var rg1 = str1.split(" ");
	var rg2 = str2.split(" ");
	for (var i = 0; i < rg1.length; i++) {

		if (rg1[i] == rg2[0]) {

			confidence+=4; 

		}

		for (var i2 = 1; i2 < rg2.length; i2++) {

			if (rg1[i] == rg2[i2]) {

				confidence+=2; 

			} else if (new RegExp(".*"+rg1[i]+".*").test(rg2[i2])) {

				confidence++; 

			}

		}

	}

	return confidence >= 3; 

}

function fnFindNameInFinalResults(strName) {

	var iFound = -1; 
	for (var iItem in rgFinalResults) {

		if (rgFinalResults[iItem].name != null) {

			if (fnSimilar(rgFinalResults[iItem].name, strName)) {

				iFound = iItem; 

			}

		}

	}
	return iFound; 

}

function fnFindFrom(strName) {

	var iFound = -1; 
	for (var iItem in rgFinalResults) {

		if (rgFinalResults[iItem].from != null) {

			if (rgFinalResults[iItem].from == strName) {

				iFound = iItem; 

			}

		}

	}
	return iFound; 

}

function fnGetFullLink(strDomain, strLink) {
	//generate full url from a partial link

	if (new RegExp("^https?:\\/\\/.+$").test(strLink)) {

		strUrl = strLink; 

	} else if (new RegExp("^\\/.*$").test(strLink)) {

		strUrl = strDomain+strLink; 

	} else {

		strUrl = strDomain+"/"+strLink;

	}

	return strUrl; 

}

function fnInArray(strData, rgArray) {

	var bFound = false; 
	for (var iData in rgArray) {

		if (strData == rgArray[iData]) {
			bFound = true; 
		}

	}
	return bFound;

}

function fnValidUrl(strUrl) {

	return new RegExp("^https?\:\\/\\/.+$").test(strUrl);

}

function fnGetHtml(strUrl, fnCallback) {

	//get html from url 
	REQUEST(strUrl, function(strError, response, strHtml) {

		if (strError) {

			throw strError; 

		}

		fnCallback(strHtml);

	});

}