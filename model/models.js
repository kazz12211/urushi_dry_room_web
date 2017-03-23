var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config');


var url = '';

if(config.dbUser ==='') {
	url = 'mongodb://' + config.dbServer + ':' + config.dbPort + '/' + config.dbName;
} else {
	url = 'mongodb://'+ config.dbUser + ':' + config.dbPassword + '@' + config.dbServer + ':' + config.dbPort + '/' + config.dbName;
}

var db = mongoose.createConnection(url, function(err, res){
    if(err) {
        console.log('[db.js : createConnection] Error connected: ' + url + ' - ' + err);
    } else {
        console.log('Success connected: ' + url);
    }
});

var ThermoHumidSchema = new Schema({
	temperature: Number,
	humidity: Number,
	timestamp: Date
});

exports.ThermoHumid = db.model('ThermoHumid', ThermoHumidSchema);