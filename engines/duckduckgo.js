var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var settings = require('../settings');

var categories = [ 'general' ];
var paging = true;
var language_support = true;

var base_url = 'https://duckduckgo.com/';
var search_string = 'html?q=%s&kl=%s&s=%s';

exports.search = function(query, language, page, callback) {
	var results = [];
	
	var offset = (page - 1) * 30
	if (language == 'all') {
        language = 'en-US'.toLowerCase();
    } else {
        language = language.replace('_', '-').toLowerCase();
    }
	
	var search_path = util.format(search_string, encodeURIComponent(query), encodeURIComponent(language), offset);
	
	var options = {
		url: base_url + search_path,
		headers: {
			'User-Agent': settings.botUserAgent1
		}
	};
	
	request(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			$('.links_main.links_deep').each(function(i, element){
				var title = $(this).find('a').text();
				var title_html = $(this).find('a').html();
				var url = $(this).find('a').attr('href');
				var content = $(this).find('.snippet').text();
				var content_html = $(this).find('.snippet').html();
				if (url != '') {
					results.push({ title: title, title_html: title_html, url: url, content: content, content_html: content_html });
				}
            });
			callback(results);
		} else {
			callback(results);
		}
	});
}