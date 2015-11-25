var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var settings = require('../settings');

var categories = [ 'it' ];
var paging = false;
var language_support = false;

var base_url = 'https://api.github.com/';
var search_string = 'search/repositories?sort=stars&order=desc&q=%s';
var accept_header = 'application/vnd.github.preview.text-match+json';

function search(query, callback) {
	var results = [];
	var search_path = util.format(search_string, encodeURIComponent(query));
	
	var options = {
		url: base_url + search_path,
		headers: {
			'Accept': accept_header,
			'User-Agent': settings.botUserAgent1
		}
	};
	
	request(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
			var jsonBody = JSON.parse(body);
			jsonBody['items'].forEach(function(element){
				var url = element['html_url'];
				var name = element['name'];
				var full_name = element['full_name'];
				var content = element['description'] || '';
				var stargazers_count = element['stargazers_count'];
				var watchers_count = element['watchers_count'];
				var forks_count = element['forks_count'];
				var language = element['language'] || '';
				if (url != '') {
					results.push({ url: url, name: name, full_name: full_name, content: content, language: language, stargazers_count: stargazers_count, watchers_count: watchers_count, forks_count: forks_count });
				}
			});
			callback(results);
		} else {
			callback(results);
		}
	});
}