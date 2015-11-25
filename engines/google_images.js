var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var settings = require('../settings');

var categories = [ 'images' ];
var paging = true;

var base_url = 'https://ajax.googleapis.com/';
var search_string = 'ajax/services/search/images?v=1.0&start=%s&rsz=large&safe=%s&filter=off&q=%s';

exports.search = function(query, page, safe_search, callback) {
	var results = [];
	
	var offset = (page - 1) * 8;
	var safesearch;
	
	if (safe_search == 0) {
        safesearch = 'off'
    } else {
        safesearch = 'on'
	}
	
	var options = {
		url: base_url + util.format(search_string, offset, safesearch, encodeURIComponent(query)),
		headers: {
			'User-Agent': settings.botUserAgent1
		},
		timeout: 2000
	};
	
	request(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
			var jsonBody = JSON.parse(body);
			jsonBody['responseData']['results'].forEach(function(element){
				var url = element['originalContextUrl'] || '';
				var title = element['titleNoFormatting'];
				var title_html = element['title'];
				var img_src = element['url'];
				var thumbnail_src = element['tbUrl'];
                var thumbnail_x = element['tbWidth'];
                var thumbnail_y = element['tbHeight'];
				if (url != '') {
                    results.push({ title: title, title_html: title_html, url: url, img_src: img_src, thumbnail_src: thumbnail_src, thumbnail_x: thumbnail_x, thumbnail_y: thumbnail_y });
                }
			});
			
			callback(results);
		} else {
			callback(results);
		}
	});
};