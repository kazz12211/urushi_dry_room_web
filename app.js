
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , https = require('https')
  , path = require('path')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override')
  , cookieParser = require('cookie-parser')
  , errorHandler = require('errorhandler')
  , session = require('express-session')
  , router = express.Router()
  , path = require('path')
  , models = require('./model/models')
  , config = require('./config');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
	extended:true
}));
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		maxAge: 60 * 60 * 1000
	}
}));
app.use(router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}
app.get('/', routes.index);
app.get('/service/thermoHumid', require('./routes/service').thermoHumid);

var mqtt = require('mqtt');
var mqtt_url = "mqtt://" + config.mqttServer + ":" + config.mqttPort;

var client = null;
if(process.env.CLOUDMQTT_URL) {
	var url = require('url');
	var u = url.parse(mqtt_url);
	client = mqtt.createClient(u.port, u.hostname, {
		username: config.mqttUser,
		password: config.mqttPassword
	});
} else {
	client = mqtt.connect(mqtt_url);	
}

client.subscribe("thermo_humid");


client.on("message", function(topic, payload) {
	var json = JSON.parse(payload.toString());
	if(json.temperature > 50 || json.temperature < 0 || json.humidity > 100 || json.humidity < 0)
		return;
	json.timestamp = new Date();
	console.log(json);
	var t = json.temperature.toFixed(2);
	var h = json.humidity.toFixed(2);
	var th = new models.ThermoHumid({
				temperature: parseFloat(t),
				humidity: parseFloat(h),
				timestamp: json.timestamp
			});
	th.save();
	
});

setInterval(function() {
	var cleanup = require('./routes/service').cleanup;
	cleanup(function() {
		console.log('Cleanup task done');
	});
}, 1000 * 60 * 60);

setInterval(function() {
	var watcher = require('./routes/service').watchCondition;
	watcher();
}, 1000 * 60 * 30);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
