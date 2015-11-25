var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var settings = require('../settings');

var categories = [ 'news' ];
var paging = true;
var language_support = true;

var base_url = 'https://www.bing.com/';
var search_string = 'news/search?q=%s&setmkt=%s&first=%s';

function search(query, language, page, callback) {
	var results = [];
	
	var offset = (page - 1) * 10 + 1;
	if (language == 'all') {
        language = 'en-US';
    } else {
        language = language.replace('_', '-');
    }
	var search_path = util.format(search_string, encodeURIComponent(query), language, offset);
	
	console.log(base_url + search_path);
	
    var j = request.jar();
    var cookie = request.cookie('SRCHHPGUSR=NEWWND=0&NRSLT=-1&SRCHLANG=' + language.split('-')[0]);
    j.setCookie(cookie, base_url);
    
	var options = {
		url: base_url + search_path,
		headers: {
			'User-Agent': settings.botUserAgent1
		},
		jar: j
	};
	
	request({options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			$('.OutOfNewsV2').remove();
			$('.sn_r').each(function(i, element){
				var title = $(this).find('.newstitle a').text();
				var title_html = $(this).find('.newstitle a').html();
				var url = $(this).find('.newstitle a').attr('href');
				var content = $(this).find('.sn_txt .sn_oi .sn_snip').text();
				var content_html = $(this).find('.sn_txt .sn_oi .sn_snip').html();
				var img_div = $(this).find('.sn_img a');
				var img_src = "";
				if (img_div.find('img').length != 0) {	
					img_src = base_url + img_div.find('img').attr('src');
				} else if (img_div.find('.rms_iac').length != 0) {
					img_src = base_url + img_div.find('.rms_iac').attr('data-src');
				}
				
				if (url != '') {
					results.push({ url: url, title: title, title_html: title_html, content: content, content_html: content_html, img_src: img_src, published_date: '' })
				}
			});
			callback(results);
        } else {
            callback(results);
        }
    });

}