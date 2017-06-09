//variables
var strEmail; 
var strWebsiteFromEmail; 
//dependencies 
const REQUEST = require('request');
const CHEERIO = require('cheerio');
const KNWL = require('knwl.js');
const KNWLI = new KNWL('english');
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
		var rgLinkList = [];
		var rgSocialList = []; 
		var rgAsync = []; 
		$('a').each(function(){

			var strHref = $(this).attr("href");
			var strFullLink = fnGetFullLink(strWebsiteFromEmail, strHref);
			//find contact us link and team/about us and social media links and add them to array 
			if (new RegExp("^.*(contact|about|team).*$").test(strHref) || SOCIAL_REGEX.test(strHref)) {
				
				//if not already in array
				if (!fnInArray(strFullLink, rgLinkList)) {
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
										if (!fnInArray(strHref, rgList)) {
											rgList.push(strHref);
										}
									}

								}); 

								fnCallback(null, [rgList, strHtml]);

							}); 
						}); 
						rgLinkList.push(strFullLink);

					} else {

						rgSocialList.push(strFullLink);

					}

					
				}

			}


		});

		//wait until links are opened
		ASYNC.parallel(rgAsync, function(error, rgResults){

			//add them to the rgVisitNext array 
			for (var iResult in rgResults) {
				
				fnScrape(rgResults[iResult][1]);

				for (var iLink in rgResults[iResult][0]) {
					if (!fnInArray(rgResults[iResult][0][iLink], rgSocialList)) {

						rgSocialList.push(rgResults[iResult][0][iLink]);

					}
				}
			}

			fnScrapeSocialMedia(rgSocialList);

		}); 


	});

	
} catch (e) {

	console.log(e);

}

//functions

function fnScrape(strHtml) {

	//todo: implement 
	console.log(strHtml.length);

}

function fnScrapeSocialMedia(rgUrls) {

	//todo: implement 
	console.log(rgUrls);

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

function fnInArray(strItemToFind, rgArray) {

	var bFound = false; 
	for (var iItem in rgArray) {
		if (strItemToFind == rgArray[iItem]) {

			bFound = true; 

		}

	}
	return bFound; 

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