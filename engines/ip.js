var request = require('request');
var settings = require('../settings');

exports.search = function(ip, callback) {
    var result = { status: "fail" };
    
    var options = {
		url: 'http://ip-api.com/json/' + ip,
		headers: {
			'User-Agent': settings.botUserAgent1
		},
		timeout: 200
	};
	
	request(options, function(error, response, body){
        if (!error && response.statusCode == 200) {
            result = JSON.parse(body);
            callback(result);
        } else {
            callback(result);
        }
	});
}