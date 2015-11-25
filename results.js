var google = require('./engines/google');
var bing = require('./engines/bing');
var async = require('async');
var scalc = require('scalc');
var unitconverter = require('./engines/unitconverter');
var freebase = require('./engines/freebase');
var google_images = require('./engines/google_images');
var google_images2 = require('./engines/google_images2');

exports.web = function(query, page, locale, language, callback) {
    async.parallel({
        google: function(callback) {
            google.search(query, true, locale, page, function(r){
                callback(null, r);
            });
        },
        bing: function(callback) {
            bing.search(query, locale, page, function(r){
                callback(null, r); 
            });
        }, 
        converter: function(callback) {
            if (page == 1) {
                unitconverter.convert(query, function(c){
                    callback(null, c);
                });
            } else {
                callback(null, null);
            }
        },
        calculator: function(callback) {
            if (page == 1) {
                try {
                    var query2 = query;
                    if (query.substr(-1) === '=') {
                        query2 = query.substr(0, query.length - 1);
                    }
                    callback(null, scalc(query2));
                } catch(e) {
                    callback(null, null);
                }
            } else {
                callback(null, null);
            }
        },
        wiki: function(callback) {
            if (page == 1) {
                freebase.search(query, language, function(w){
                    callback(null, w);
                });
            } else {
                callback(null, {});
            }
        },
        google_images: function(callback) {
            if (page == 1) {
                google_images2.search(query, true, locale, page, function(r){
                    callback(null, r);
                });
            } else {
                callback(null, null);
            }
        }
    },
    function(err, raw_results) {
        var newspreview = false;
        
        // newspreview
        
        var imagespreview = false;
        
        // imagespreview
        
        var didyoumean = [];
        
        //didyoumean
        
        var suggestions = [];
        
        // suggestion
        
        var results = [];
        
        
        //title
        //title_html
        //url
        //content
        //content_html
        
        
        //combine results...
        
        var i = 1;
        raw_results.google.forEach(function(g){
            if (typeof g.suggestion !== "undefined") {
                if (suggestions.indexOf(g.suggestion) == -1) {
                    suggestions.push(g.suggestion);
                    return;
                }
            }
            
            if (typeof g.didyoumean !== "undefined") {
                if (didyoumean.indexOf(g.didyoumean) == -1) {
                    didyoumean.push(g.didyoumean);
                    return;
                }
            }
            
            if (typeof g.imagespreview !== "undefined") {
                imagespreview = true;
                return;
            }
            
            if (typeof g.newspreview !== "undefined") {
                newspreview = true;
                return;
            }
            
            var duplicate = false;
            results.forEach(function(r){
               if (isUrlEquals(r.data.url, g.url)) {
                   duplicate = true;
                   r.engines.push({ engine: "google", index: i });
                   return;
               }
            });
            
            if (!duplicate) {
                results.push({ score: 0, engines: [{ engine: "google", index: i }], data: { url: g.url, title: g.title, title_html: g.title_html, content: g.content, content_html: g.content_html }});
            }
            
            i++;
        });
        
        i = 1;
        raw_results.bing.forEach(function(b){
            if (typeof b.suggestion !== "undefined") {
                if (suggestions.indexOf(b.suggestion) == -1) {
                    suggestions.push(b.suggestion);
                    return;
                }
            }
            
            var duplicate = false;
            results.forEach(function(r){
               if (isUrlEquals(r.data.url, b.url)) {
                   r.engines.push({ engine: "bing", index: i });
                   duplicate = true;
                   return;
               }
            });
            
            if (!duplicate) {
                results.push({ score: 0, engines: [{ engine: "bing", index: i }], data: { url: b.url, title: b.title, title_html: b.title_html, content: b.content, content_html: b.content_html }});
            }
            
            i++;
        });
        
        //calculate score...
        results.forEach(function(r){
            var weight = 1;
            
            r.engines.forEach(function(re){
                if (re.engine == "google") weight *= 1.2;
                if (re.engine == "bing") weight *= 1.0;
                if (re.engine == "duckduckgo") weight *= 1.0;
            });
            
            
            r.engines.forEach(function(re){
                 r.score += (r.engines.length * weight / re.index)
            });
        });
        
        
        //sort scores...
        results.sort(function(a, b) {
            return b.score - a.score;
        });
        
        results.forEach(function(r){
            try {
                decodeURIComponent(r.data.url);
            } catch(e) {
                // ERR ON DECODE console.log(r.data.url);
            }
        })
        
        //its done.
        callback(didyoumean, suggestions, imagespreview, newspreview, results, raw_results.calculator, raw_results.converter, raw_results.wiki, raw_results.google_images);
    });
}


function isUrlEquals(url1, url2) {
    url1 = stripTrailingSlash(url1.toLowerCase().replace(/^https?:\/\//,'').replace(/^www./, ''));
    url2 = stripTrailingSlash(url2.toLowerCase().replace(/^https?:\/\//,'').replace(/^www./, ''));
    if (url1 == url2) {
        return true;
    }
    return false;
}

function stripTrailingSlash(str) {
    if(str.substr(-1) === '/') {
        return str.substr(0, str.length - 1);
    }
    return str;
}