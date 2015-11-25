var sharp = require('sharp');
var request = require('request');
var uuid_pure = require("uuid-pure");
var fs = require("fs");
var app = require("../app.js");

exports.resize = function(req, res) {
    var source = req.query.source;
    var h = parseInt(req.query.h);
    var w = parseInt(req.query.w);
    
    if (typeof source != "undefined" && typeof h != "undefined" && typeof w != "undefined") {
        app.redisClient.get(source, function(error, reply) {
            if (!error && reply) {
                fs.exists("./imgres_cache/" + source, function (exists) {
                    if (exists) {
                        var transformer = sharp("./imgres_cache/" + source).resize(w, h).crop(sharp.gravity.north).quality(80).png().on('error', function(err) {
                            res.end();
                        });
                        transformer.pipe(res);
                    } else {
                        request.get({url: reply, encoding: 'binary', timeout: 2000}, function (err, response, body) {
                            fs.writeFile("./imgres_cache/" + source, body, 'binary', function(err) {
                                if(err) {
                                    console.log(err);
                                } else {
                                    var transformer = sharp("./imgres_cache/" + source).resize(w, h).crop(sharp.gravity.north).quality(80).png().on('error', function(err) {
                                        res.end();
                                    });
                                    transformer.pipe(res);
                                    setInterval(function(){
                                        fs.unlink("./imgres_cache/" + source, function(){});
                                    }, 30 * 1000);
                                }
                            });
                        });
                    }
                });
            } else {
                res.end();
            }
        });
    } else {
        res.end();
    }
}