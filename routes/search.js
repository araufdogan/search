var render = require('../render');
var results = require('../results');

exports.web = function(req, res) {
    if (typeof req.query.q == "undefined") {
        res.send(render.home({ __: res.__, user: req.session.user }));
    } else {
        var p = parseInt(req.query.p || 1);
        var locale = req.cookies.locale || "en-US";
        var language = req.cookies.language || "en";
        var q = req.query.q.replace(/^ /g, "").replace(/ $/g, "");
        if (q != req.query.q) {
            res.redirect('/web?q=' + encodeURIComponent(q) + "&e=" + encodeURIComponent(req.session.user.e));
            return;
        }
        
        results.web(q, p, locale, language, function(didyoumean, suggestions, imagespreview, newspreview, results, calculator, converter, wiki, images){
            res.send(render.web({ __: res.__, user: req.session.user, cookies: req.cookies, q: req.query.q, p: p, didyoumean: didyoumean, suggestions: suggestions, imagespreview: imagespreview,newspreview: newspreview, results: results, calculator: calculator, converter: converter, wiki: wiki, images: images })); 
        });
    }
}

exports.autocomplete = function(req, res) {
    if (typeof req.query.q == "undefined") {
        res.end();
    } else {
        var locale = req.cookies.locale || "en";
        require('../engines/autocomplete').google(req.query.q, locale, function(results){
            res.json(results);
        });
    }
}