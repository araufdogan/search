var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var settings = require('../settings');

var categories = [ 'general' ];
var paging = true;
var language_support = true;

var base_url = 'https://www.bing.com/';
var search_string = 'search?q=%s&setmkt=%s&first=%s';

exports.search = function(query, language, page, callback) {
    var results = [];

    var offset = (page - 1) * 10 + 1;
    if (language == 'all') {
        language = 'en-US';
    }
    
    var search_path = util.format(search_string, encodeURIComponent(query), encodeURIComponent(language), offset);
    
    var j = request.jar();
    var cookie = request.cookie('SRCHHPGUSR=NEWWND=0&NRSLT=-1&SRCHLANG=' + language.split('-')[0]);
    j.setCookie(cookie, base_url);

	var options = {
		url: base_url + search_path,
		headers: {
			'User-Agent': settings.botUserAgent1
		},
		jar: j,
		encoding: 'utf8',
		timeout: 2000
	};
	
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            $('.sa_cc').each(function(i, element){
                //old bing..
            });

            if (results.length != 0) {
                callback(results);
            } else {
                $('li.b_algo').each(function(i, element){
                    var title = $(this).find('h2 a').text();
                    var title_html = $(this).find('h2 a').html();
                    var url = $(this).find('h2 a').attr('href');
                    var content = $(this).find('p').text();
					var content_html = $(this).find('p').html();
					if (url != '') {
                        results.push({ title: title, title_html: title_html, url: url, content: content, content_html: content_html });
                    }
                });
                callback(results);
            }
        } else {
            callback(results);
        }
    });
}