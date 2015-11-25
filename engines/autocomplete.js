/**
 * Created by ARD on 08.11.2015.
 */

var request = require('request');
var xml2js = require('xml2js');
var settings = require('../settings');

exports.dbpedia = function(query, callback) {
    // dbpedia autocompleter, no HTTPS
    var results = [];
    var autocomplete_url = 'http://lookup.dbpedia.org/api/search.asmx/KeywordSearch?';
    request(autocomplete_url + 'QueryString=' + encodeURIComponent(query), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            xml2js.parseString(body, function(err, xresults){
                if (!err && typeof xresults['ArrayOfResult']['Result'] != 'undefined') {
                    xresults['ArrayOfResult']['Result'].forEach(function(xresult){
                        results.push(xresult['Label'][0].toString());
                    });
                    callback(results)
                } else {
                    callback(results);
                }
            });
        } else {
            callback(results);
        }
    });
}

exports.duckduckgo = function(query, callback) {
    // duckduckgo autocompleter
    var results = [];
    var autocomplete_url = 'https://ac.duckduckgo.com/ac/?q=' + encodeURIComponent(query) + '&type=list';
    request(autocomplete_url, function(error, response, body){
        if (!error && response.statusCode == 200) {
            if (JSON.parse(body).length > 1) {
                results = JSON.parse(body)[1];
            }
            callback(results);
        } else {
            callback(results);
        }
    });
}

exports.google = function(query, locale, callback){
    // google autocompleter
    var results = [];
    var autocomplete_url = 'https://suggestqueries.google.com/complete/search?client=toolbar&q=' + encodeURIComponent(query) + "&hl=" + locale;
    
    var options = {
		url: autocomplete_url,
		headers: {
			'User-Agent': settings.botUserAgent1
		},
		encoding: 'utf8',
		timeout: 2000
	};
    
    request(options, function(error, response, body){
        if (!error && response.statusCode == 200) {
            xml2js.parseString(body.toString(), function(err, xresults){
                if (!err) {
                    if (xresults['toplevel'] != '') {
                        xresults['toplevel']['CompleteSuggestion'].forEach(function(xresult){
                            results.push(xresult['suggestion'][0]['$']['data']);
                        });
                    }
                    callback(results)
                } else {
                    callback(results);
                }
            });
        } else {
            callback(results);
        }
    });
}

exports.startpage = function (query, callback) {
    // wikipedia autocompleter
    var results = [];
    var autocomplete_url = 'https://startpage.com/do/suggest?&query=' + encodeURIComponent(query);
    request(autocomplete_url, function(error, response, body){
        if (!error && response.statusCode == 200) {
            body.split('\n').forEach(function(result){
                if (result != '') {
                    results.push(result);
                }
            });
            callback(results);
        } else {
            callback(results);
        }
    });
}

exports.wikipedia = function(query, callback) {
    // wikipedia autocompleter
    var results = [];
    var autocomplete_url = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(query) + '&limit=10&namespace=0&format=json';
    request(autocomplete_url, function(error, response, body){
        if (!error && response.statusCode == 200) {
            if (JSON.parse(body).length > 1) {
                results = JSON.parse(body)[1];
            }
            callback(results);
        } else {
            callback(results);
        }
    });
}