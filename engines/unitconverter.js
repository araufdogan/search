var request = require('request');
var escapeStringRegexp = require('escape-string-regexp');

var units = [
    { character: "$", base: "USD", languages: { tr: [ "dolar" ], en: [ "dollar" ] }, type: 1, shown: { tr: "ABD Doları", en: "U.S. Dollar%s" } },
    { character: "₺", base: "TRY", languages: { tr: [ "tl", "try", "türk lirası" ], en: [ "tl", "try", "turkish liras", "turkish lira" ] }, type: 1, shown: { tr: "Türk Lirası", en: "Turkish Lira%s" } },
    { character: "€", base: "EUR", languages: { tr: [ "euro", "avro", "eyro", "eyrö" ], en: [ "euro" ] }, type: 1, shown: { tr: "Euro", en: "Euro%s" } },
];

function parse(q, callback) {
    
    var re = "^" + "(\\d+)?" + "(\\s)?" + "(\\S+)" + "(\\s)" + "(\\S+)" + "(\\s)" + "(\\d+)?" + "(\\S+)$";
    var regex = (new RegExp(re, "g").exec(q));
    
    if (regex) {
        var fromValue;
        var fromUnit;
        var toValue;
        var toUnit;
        
        if (regex[1]) { fromValue = parseInt(regex[1]); } else { fromValue = 1; }
        if (regex[3]) fromUnit = regex[3];
        if (regex[7]) { toValue = parseInt(regex[7]); } else { toValue = 1; }
        if (regex[8]) toUnit = regex[8];
        
        var fromFound = false;
        var toFound = false;
        units.forEach(function(unit){
            if (unit.character == fromUnit) {
                fromUnit = unit;
                fromFound = true;
            }
            
            if (fromFound) {
                return;
            }
            
            if (unit.base == fromUnit) {
                fromUnit = unit;
                fromFound = true;
            }
            
            if (fromFound) {
                return;
            }
            
            for (var language in unit.languages) {
                var obj = unit.languages[language];
                obj.forEach(function(lang){
                    if (lang == fromUnit) {
                        fromUnit = unit;
                        fromFound = true;
                        return;
                    }
                });
                if (fromFound) return;
            }
            
            if (fromFound) return;
        });
        
        units.forEach(function(unit){
            if (unit.character == toUnit) {
                toUnit = unit;
                toFound = true;
            }
            
            if (toFound) {
                return;
            }
            
            if (unit.base == toUnit) {
                toUnit = unit;
                toFound = true;
            }
            
            if (toFound) {
                return;
            }
            
            for (var language in unit.languages) {
                var obj = unit.languages[language];
                obj.forEach(function(lang){
                    if (lang == toUnit) {
                        toUnit = unit;
                        toFound = true;
                        return;
                    }
                });
                if (toFound) return;
            }
            
            if (toFound) return;
        });
        
        if (fromFound && toFound && fromUnit.type == toUnit.type) {
            callback({ query: q, fromValue: fromValue, fromUnit: fromUnit, toValue: toValue, toUnit: toUnit })
        } else {
            callback(null);
        }
        
    } else {
        callback(null);
    }
}

exports.convert = function(query, callback){
    parse(query, function(converter){
        if (converter) {
            if (converter.fromUnit.type == 1) {
                request("https://openexchangerates.org/api/latest.json?app_id=516806289df64e988a15ab25f0d09918", function(error, response, body){
                    if (!error && response.statusCode == 200) {
                        var json = JSON.parse(body);
                        var x = converter.fromValue * json.rates[converter.toUnit.base] / json.rates[converter.fromUnit.base];
                        callback({ result: x, converter: converter });
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