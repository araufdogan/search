require("dot").process({
    global: "_page.render"
    , destination: __dirname + "/render/"
    , path: (__dirname + "/views")
});

var geoip = require('geoip-lite');
var uuid_pure = require("uuid-pure");
var acceptLanguage = require('accept-language');
var querystring = require('querystring');

var render	=	require('./render');

var url = require('url');
var express	=	require('express');
var i18n    =   require("i18n");
var cookieParser    =   require('cookie-parser');
var redis	=	require('redis');
var session	=	require('express-session');
var redisStore	=	require('connect-redis')(session);
var bodyParser	=	require('body-parser');
var client	=	redis.createClient();

i18n.configure({
    locales: ['tr', 'en'],
    cookie: 'language',
    directory: __dirname + '/locales'
});

var app	= express();
app.disable('x-powered-by');
app.set('view engine', 'dot');
app.use(session({
	secret: 'F2b4XJX1OV5550CZnjX33Fhq8Vjw15jL',
	name: 'wa',
	store: new redisStore({ host: '127.0.0.1', port: 6379, client: client, ttl :  260}),
	saveUninitialized: true,
	resave: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(i18n.init);
app.use(express.static('public'));

app.use(function(req, res, next) {
    require("fs").appendFile('logs.txt', getDateTime() + " - " + req.connection.remoteAddress + " - " + req.url + "\n", function (err) {
        next();
    });
});

app.use(function (req, res, next) {
	var ip_address = req.connection.remoteAddress;
	var user_agent = req.headers['user-agent'];
	var languages = acceptLanguage.parse(req.headers['accept-language']);
    
	if (typeof req.cookies.locale == 'undefined') {
        var locale = "en-US";
        var language = "en";
        if (languages.length > 0) {
            locale = languages[0].value.replace('_', '-');
            language = languages[0].language;
        }
        
        res.cookie('locale', locale);
        res.cookie('language', language);
	}
	
	if (typeof req.session.user == 'undefined') {
        require('./engines/ip').search(ip_address, function(ip_lookup){
            var e = uuid_pure.newId();
            req.query['e'] = e;
            
            req.session.user = {};
            req.session.user.ip_address = ip_address;
            req.session.user.user_agent = user_agent;
            req.session.user.ip_lookup = ip_lookup;
            req.session.user.e = e;
            
            if (req.path == "/" || req.path == "/web" || req.path == "/autocomplete") {
                res.redirect(req.path + '?' + querystring.stringify(req.query));
            } else {
                next();
            }
        });
	} else {
        if (typeof req.query.e == 'undefined') {
            req.query['e'] = req.session.user.e;
            if (req.path == "/" || req.path == "/web" || req.path == "/autocomplete") {
                res.redirect(req.path + '?' + querystring.stringify(req.query));
            } else {
                next();
            }
        } else {
            if (req.query.e == req.session.user.e) {
                next();
            } else {
                req.query['e'] = req.session.user.e;
                if (req.path == "/" || req.path == "/web" || req.path == "/autocomplete") {
                    res.redirect(req.path + '?' + querystring.stringify(req.query));
                } else {
                    next();
                }
            }
        }
	}
});

var search = require('./routes/search.js');
var images = require('./routes/images.js');
app.get('/', search.web);
app.get('/web', search.web);
app.get('/autocomplete', search.autocomplete);
app.get('/imgres', images.resize);

app.listen(3000, function(err){
    if (err) {
        console.log(err);
    } else {
        console.log("App Started on PORT 3000");
    }
});

exports.redisClient = client;

function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return day + ":" + month + ":" + year + " " + hour + ":" + min + ":" + sec;
}