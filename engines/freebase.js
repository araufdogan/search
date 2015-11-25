var request = require('request');
var util = require('util');
var settings = require('../settings');


var base_url = 'https://www.googleapis.com/';
var search_string = 'freebase/v1/search/?query=%s&lang=%s&limit=1&key=<YOURKEY>';
var entry_string = 'freebase/v1/topic%s?lang=%s&key=<YOURKEY>'

exports.search = function(query, language, callback) {
    var search_path = util.format(search_string, encodeURIComponent(query), encodeURIComponent(language));

	var options = {
		url: base_url + search_path,
		headers: {
			'User-Agent': settings.botUserAgent1
		},
		encoding: 'utf8',
		timeout: 2000
	};
    
    request(options, function(error, response, body){
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            if (json.status == "200 OK" && json.result.length > 0 && json.result[0].score > 55) {
                var entry_path = util.format(entry_string, json.result[0].id, encodeURIComponent(language))
                options = {
                    url: base_url + entry_path,
                    headers: {
                        'User-Agent': settings.botUserAgent1
                    },
                    encoding: 'utf8',
                    timeout: 5000
                };
                request(options, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        json = JSON.parse(body);
                        if (json.property) {
                            var type = "";
                            json["property"]["/type/object/type"]["values"].forEach(function(t){
                                if (t.id == "/people/person") {
                                    type = t.id;
                                    return;
                                }
                            });
                            
                            if (type == "/people/person") {
                                var id = null;
                                var name = null;
                                var wikipedia = null;
                                var description = null;
                                var description_value = null;
                                var notable_type = null;
                                var date_of_birth = null;
                                var place_of_birth = null;
                                var date_of_death = null;
                                var place_of_death = null;
                                var social_media_presence = [];
                                var children = [];
                                var parents = [];
                                
                                try { id = json["property"]["/type/object/id"]["values"][0]["text"]; } catch(e) { }
                                try { wikipedia = json["property"]["/common/topic/description"]["values"][0]["citation"]["uri"]; } catch(e) { }
                                try { name = json["property"]["/type/object/name"]["values"][0]["text"]; wikipedia = "https://" + language.split('-')[0] + ".wikipedia.org/w/index.php?search=" + name; } catch(e) { }
                                try { description = json["property"]["/common/topic/description"]["values"][0]["text"]; } catch(e) { }
                                try { description_value = json["property"]["/common/topic/description"]["values"][0]["value"]; } catch(e) { }
                                try { notable_type = json["property"]["/common/topic/notable_types"]["values"][0]["text"]; } catch(e) { }
                                try { date_of_birth = json["property"]["/people/person/date_of_birth"]["values"][0]["text"]; } catch(e) { }
                                try { place_of_birth = json["property"]["/people/person/place_of_birth"]["values"][0]["text"]; } catch(e) { }
                                try { date_of_death = json["property"]["/people/deceased_person/date_of_death"]["values"][0]["text"]; } catch(e) { }
                                try { place_of_death = json["property"]["/people/deceased_person/place_of_death"]["values"][0]["text"]; } catch(e) { }
                                try {
                                    var facebook = false;
                                    var twitter = false;
                                    var googleplus = false;
                                    var instagram = false;
                                    json["property"]["/common/topic/social_media_presence"]["values"].forEach(function(social){
                                        if (social.text.indexOf("twitter.com") != -1) {
                                            if (twitter = false)
                                                social_media_presence.push({ type: "twitter", url: social.text });
                                            twitter = true;
                                        } else if (social.text.indexOf("facebook.com") != -1) {
                                            if (facebook == false)
                                                social_media_presence.push({ type: "facebook", url: social.text });
                                            facebook = true;
                                        } else if (social.text.indexOf("plus.google.com") != -1) {
                                            if (googleplus == false)
                                                social_media_presence.push({ type: "googleplus", url: social.text });
                                            googleplus = true;
                                        } else if (social.text.indexOf("instagram") != -1) {
                                            if (instagram == false)
                                                social_media_presence.push({ type: "instagram", url: social.text });
                                            instagram = true;
                                        }
                                    });
                                } catch(e) { }
                                try {
                                    json["property"]["/people/person/children"]["values"].forEach(function(child){
                                        children.push(child.text);
                                    });
                                } catch(e) { }
                                try {
                                    json["property"]["/people/person/parents"]["values"].forEach(function(parent){
                                        parents.push(parent.text);
                                    });
                                } catch(e) { }
                                
                                callback({ type: type, id: id, wikipedia: wikipedia, name: name, description: description, description_value: description_value, notable_type: notable_type, date_of_birth: date_of_birth, place_of_birth: place_of_birth ,date_of_death: date_of_death, place_of_death: place_of_death, social_media_presence: social_media_presence, children: children, parents: parents });
                                
                            } else {
                                callback(null);
                            }
                        } else {
                            callback(null);
                        }
                    } else {
                        callback(null);
                    }
                });
            } else {
                callback(null);
            }
        } else {
            callback(null);
        }
    });
}