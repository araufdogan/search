var app = require("../app");

var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var settings = require('../settings');
var sync_request = require('sync-request');
var url = require('url');
var striptags = require('striptags');
var uuid_pure = require("uuid-pure");

var categories = [ 'general' ];
var paging = true;
var language_support = true;

var default_hostname = 'www.google.com';

var pref_cookie = ''
var nid_cookie = {}

var country_to_hostname = {
	'BG': 'www.google.bg',  // Bulgaria
	'CZ': 'www.google.cz',  // Czech Republic
	'DE': 'www.google.de',  // Germany
	'DK': 'www.google.dk',  // Denmark
	'AT': 'www.google.at',  // Austria
	'CH': 'www.google.ch',  // Switzerland
	'GR': 'www.google.gr',  // Greece
	'AU': 'www.google.com.au',  // Australia
	'CA': 'www.google.ca',  // Canada
	'GB': 'www.google.co.uk',  // United Kingdom
	'ID': 'www.google.co.id',  // Indonesia
	'IE': 'www.google.ie',  // Ireland
	'IN': 'www.google.co.in',  // India
	'MY': 'www.google.com.my',  // Malaysia
	'NZ': 'www.google.co.nz',  // New Zealand
	'PH': 'www.google.com.ph',  // Philippines
	'SG': 'www.google.com.sg',  // Singapore
	// 'US': 'www.google.us',  // United State, redirect to .com
	'ZA': 'www.google.co.za',  // South Africa
	'AR': 'www.google.com.ar',  // Argentina
	'CL': 'www.google.cl',  // Chile
	'ES': 'www.google.es',  // Span
	'MX': 'www.google.com.mx',  // Mexico
	'EE': 'www.google.ee',  // Estonia
	'FI': 'www.google.fi',  // Finland
	'BE': 'www.google.be',  // Belgium
	'FR': 'www.google.fr',  // France
	'IL': 'www.google.co.il',  // Israel
	'HR': 'www.google.hr',  // Croatia
	'HU': 'www.google.hu',  // Hungary
	'IT': 'www.google.it',  // Italy
	'JP': 'www.google.co.jp',  // Japan
	'KR': 'www.google.co.kr',  // South Korean
	'LT': 'www.google.lt',  // Lithuania
	'LV': 'www.google.lv',  // Latvia
	'NO': 'www.google.no',  // Norway
	'NL': 'www.google.nl',  // Netherlands
	'PL': 'www.google.pl',  // Poland
	'BR': 'www.google.com.br',  // Brazil
	'PT': 'www.google.pt',  // Portugal
	'RO': 'www.google.ro',  // Romania
	'RU': 'www.google.ru',  // Russia
	'SK': 'www.google.sk',  // Slovakia
	'SL': 'www.google.si',  // Slovenia (SL -> si)
	'SE': 'www.google.se',  // Sweden
	'TH': 'www.google.co.th',  // Thailand
	'TR': 'www.google.com.tr',  // Turkey
	'UA': 'www.google.com.ua',  // Ikraine
	// 'CN': 'www.google.cn',  // China, only from china ?
	'HK': 'www.google.com.hk',  // Hong kong
	'TW': 'www.google.com.tw'  // Taiwan
}

var search_path = '/search'
var search_url = 'https://%s' + search_path + '?q=%s&start=%s&gbv=1&nfpr=1&&tbm=isch&site=imghp&source=hp&biw=1680&bih=949&surl=1'

exports.search = function(query, use_locale_domain, language, page, callback) {
    var results = [];
	
	var offset = (page - 1) * 10;
	var country = 'US';
	if (language == 'all') {
        language = 'en'
        country = 'US'
    } else {
		var language_array = language.toLowerCase().split('-');
		
		if (language_array.length == 2) {
			country = language_array[1];
		} else {
			country = 'US';
		}
		language = language_array[0] + ',' + language_array[0] + '-' + country;
	}
	
	var google_hostname;
	if (use_locale_domain) {
		google_hostname = country_to_hostname[country.toUpperCase()] || default_hostname;
	} else {
		google_hostname = default_hostname;
	}
	
	var j = request.jar();
	var cookie = '';
	if (google_hostname == default_hostname) {
		cookie = get_google_pref_cookie();
	}
	cookie += ';' + get_google_nid_cookie(google_hostname);
	
    var cookie = request.cookie(cookie);
    j.setCookie(cookie, google_hostname);

	var options = {
		url: util.format(search_url, google_hostname, encodeURIComponent(query), offset),
		headers: {
			'Accept-Language': language,
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'User-Agent': settings.botUserAgent1
		},
		jar: j,
		encoding: 'utf8',
		timeout: 2000
	};
	
	request(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            
            $('table.images_table td').each(function(i, element){
                var key = uuid_pure.newId();
                var title = "";
                var title_html = "";
                var url = parse_url($(this).find("a").attr('href') || "") || "";
                var img_src = "";
				var thumbnail_src = $(this).find("img").attr("src");
                var thumbnail_x = $(this).find("img").attr("width");
                var thumbnail_y = $(this).find("img").attr("height");
				if (url != '') {
                    app.redisClient.set(key, thumbnail_src);
                    app.redisClient.expire(key, 30);
                    results.push({ key: key, title: title, title_html: title_html, url: url, img_src: img_src, thumbnail_src: thumbnail_src, thumbnail_x: thumbnail_x, thumbnail_y: thumbnail_y });
                }
            });
			callback(results);
		} else {
			callback(results);
		}
	});
}


function get_google_pref_cookie() {
	if (pref_cookie != '') return pref_cookie;
	var res = sync_request('GET', 'https://www.google.com/ncr');
	pref_cookie = res['headers']['set-cookie'][0].split(';')[0];
	return pref_cookie;
}

function get_google_nid_cookie(google_hostname) {
	if (nid_cookie[google_hostname]) { return nid_cookie[google_hostname]; }
	var res = sync_request('GET', 'https://' + google_hostname);
	nid_cookie[google_hostname] = res['headers']['set-cookie'][1].split(';')[0];
	return nid_cookie[google_hostname];
}

function parse_url(url_string, google_hostname) {
	if (url_string == '') {
		return '';
	} else {
		var parsed_url = url.parse(url_string, true);
		return parsed_url.query.q;
	}
}

function stringStartsWith (string, prefix) {
    return string.slice(0, prefix.length) == prefix;
}
