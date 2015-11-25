var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var settings = require('../settings');

var categories = [ 'images' ];
var paging = true;

var base_url = 'https://www.bing.com/';
var search_string = 'images/search?q=%s&count=10&first=%s';
var thumb_url = "https://www.bing.com/th?id=%s";

function search(query, language, page, callback) {
    var results = [];

    var offset = (page - 1) * 10 + 1;
    if (language == 'all') {
        language = 'en-US';
    } else {
        language = language.replace('_', '-');
    }
    var search_path = util.format(search_string, encodeURIComponent(query), offset);

    var j = request.jar();
    var cookie = request.cookie('SRCHHPGUSR=NEWWND=0&NRSLT=-1&SRCHLANG=' + language.split('-')[0] + '&ADLT=DEMOTE'); //OFF DEMOTE STRICT
    j.setCookie(cookie, base_url);
    
	var options = {
		url: base_url + search_path,
		headers: {
			'User-Agent': settings.botUserAgent1
		},
		jar: j
	};
	
	request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            $('.item').each(function(i, element){
                var img_src = $(this).find('a').attr('href');
                var thumbnail_src = $(this).find('a img').attr('src');
                var thumbnail_x = $(this).find('a img').attr('width');
                var thumbnail_y = $(this).find('a img').attr('height');
                var url = $(this).find('.meta a').attr('href');
                var title = $(this).find('.meta .des').text();
                var title_html = $(this).find('.meta .des').html();

                if (url != '') {
                    results.push({ title: title, title_html: title_html, url: url, img_src: img_src, thumbnail_src: thumbnail_src, thumbnail_x: thumbnail_x, thumbnail_y: thumbnail_y });
                }
            });
            callback(results);
        } else {
            callback(results);
        }
    });
}