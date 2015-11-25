var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var settings = require('../settings');

var categories = [ 'news' ];
var paging = true;
var language_support = true;

var base_url = 'https://ajax.googleapis.com/';
var search_string = 'ajax/services/search/news?v=2.0&start=%s&rsz=large&safe=off&filter=off&q=%s&hl=%s';

function search(query, language, page, callback) {
	var results = [];
	
	var offset = (page - 1) * 8;
	
	if (language == 'all') {
        language = 'en-US';
    } else {
        language = language.replace('_', '-');
    }
	
	var options = {
		url: base_url + util.format(search_string, offset, encodeURIComponent(query), language),
		headers: {
			'User-Agent': settings.botUserAgent1
		}
	};
	
	request(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
			var jsonBody = JSON.parse(body);
			jsonBody['responseData']['results'].forEach(function(element){
				var url = element['unescapedUrl'];
				var title = element['titleNoFormatting'];
				var title_html = element['title'];
				var content = '';
				var content_html = element['content'];
				var img_src = '';
				if (element['image']) {
					img_src = element['image']['url'];
				}
				var published_date = element['publishedDate'];
				
				if (url != '') {
					results.push({ url: url, title: title, title_html: title_html, content: content, content_html: content_html, img_src: img_src, published_date: '' })
				}
				callback(results);
			});
		} else {
			callback(results);
		}
	});
}