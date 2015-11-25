var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var settings = require('../settings');

var categories = [ 'videos' ];
var paging = true;
var language_support = true;

var search_url = 'https://api.dailymotion.com/videos?fields=created_time,title,description,duration,url,thumbnail_360_url,id&sort=relevance&limit=5&page=%s&search=%s&localization=%s';
var embedded_url = '<iframe frameborder="0" width="540" height="304" data-src="//www.dailymotion.com/embed/video/%s" allowfullscreen></iframe>';

function search(query, language, page, callback) {
	var results = [];
	
	if (language == 'all') {
        language = 'en-US';
    }
	var search_string = util.format(search_url, page, query, language);
	
	var options = {
		url: search_string,
		headers: {
			'User-Agent': settings.botUserAgent1
		}
	};
	
	request(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
			var jsonBody = JSON.parse(body);
			jsonBody['list'].forEach(function(element){
				results.push({ url: element['url'], id: element['id'], title: element['title'], content: element['description'], created_date: element['created_time'], duration: element['duration'], thumbnail_src: element['thumbnail_360_url'], embedded: util.format(embedded_url, element['id']) });
			});
			callback(results);
		} else {
			callback(results);
		}
	});
}

search("q", "all", 1, function(err){
	console.log(err);
});