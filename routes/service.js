var express = require('express');
var mongoose = require('mongoose');
var models = require('../model/models');
var bson = require('../lib/bson');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var ThermoHumid = models.ThermoHumid;

var humidRange = [70,85];
var tempRange = [24,28];

function removeOldRecords(callback) {
	var time = Date.now() - 1000 * 60 * 60 * 24 * 7;
	var date = new Date(time);
	ThermoHumid.remove({timestamp: {$lt: date}}, function(err) {
		if(err) {
			console.log('Error removing old records: ' + err);
		}
		callback();
	});
}

function sendAlertIFTTT(data) {
	var eventName = 'thermo_humid_alert';
	var key = 'bBweqhDuXl8a1TwXHHleCp';
	var clientReq = require('request');
	var reqOptions = {
		uri:'https://maker.ifttt.com/trigger/' + eventName + '/with/key/' + key,
		form: {
			value1: data.temperature,
			value2: data.humidity
		},
		json: true
	};
	console.log('Sending data for IFTTT: ' + JSON.stringify(reqOptions));
	clientReq.post(reqOptions, function(err, res, body) {
		if(!err && res.statusCode == 200) {
			console.log('Data sent to IFTTT successfully');
		} else {
			console.log('Error: ' + res.statusCode);
		}
	});
	
}

function environmentAlert() {
	ThermoHumid.find({})
		.sort({timestamp:-1})
		.limit(1)
		.exec(function(err, collection) {
			if(err) {
				console.log('Error: ' + err);
				return;
			}
			if(!collection) {
				console.log('Error data: ' + collection);
				return;
			}
			var data = collection[0];
			if(data.temperature < tempRange[0] || 
				data.temperature > tempRange[1] ||
				data.humidity < humidRange[0] ||
				data.humidity > humidRange[1]) {
				sendAlertIFTTT(data);
			}
		});
}

exports.thermoHumid = function(req, res) {
	var since = req.query.since;
	var time = Date.now() - 1000 * 60 * 60 * since;
	var date = new Date(time);
	ThermoHumid.find({})
		.where('timestamp').gte(date)
		.sort({timestamp:-1})
		.exec(function(err, docs) {
			if(err) {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end('[]');			
			} else {
				var response = bson.toJsonString(docs.reverse());
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(response);			
			}
		});
};

exports.cleanup = function(callback) {
	removeOldRecords(callback);
};

exports.watchCondition = environmentAlert;

