var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var settings = require('../settings');

var categories = [ 'it' ];
var paging = false;
var language_support = false;

var base_url = 'https://stackoverflow.com/';
var search_string = 'search?q=%s&page=%s';

function search(query, page, callback) {
	var results = [];
	var search_path = util.format(search_string, encodeURIComponent(query), page);
	
	var options = {
		url: base_url + search_path,
		headers: {
			'User-Agent': settings.botUserAgent1
		}
	};
	
	request(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			$('.question-summary').each(function(i, element){
				var url = $(this).find('.result-link span a').attr('href') || '';
				var title = $(this).find('.result-link span a').attr('title') || '';
				var title_html = $(this).find('.result-link span a').attr('title') || '';
				var content = $(this).find('.excerpt').text();
				var content_html = $(this).find('.excerpt').html();
				if (url != '') {
					results.push({ url: url, title: title, title_html: title_html, content: content, content_html: content_html });
				}
			});
			callback(results);
		} else {
			callback(results);
		}
	});
}