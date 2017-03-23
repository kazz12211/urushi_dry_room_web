'use strict';

var mongodb = require('mongodb');
var vm      = require('vm');
var json    = require('./json');

var DBRef = function (namespace, oid, db) {
  if (db === undefined || db === null) {
    db = '';
  }

  return mongodb.DBRef(namespace, oid, db);
};

var Timestamp = function (high, low) {
  return mongodb.Timestamp(low, high);
};

exports.getSandbox = function () {
  return {
    Long: mongodb.Long,
    NumberLong: mongodb.Long,
    Double: mongodb.Double,
    NumberDouble: mongodb.Double,
    ObjectId: mongodb.ObjectID,
    ObjectID: mongodb.ObjectID,
    Timestamp: Timestamp,
    DBRef: DBRef,
    Dbref: DBRef,
    Binary: mongodb.Binary,
    BinData: mongodb.Binary,
    Code: mongodb.Code,
    Symbol: mongodb.Symbol,
    MinKey: mongodb.MinKey,
    MaxKey: mongodb.MaxKey,
    ISODate: Date,
    Date: Date,
  };
};

exports.toBSON = function (string) {
  var sandbox = exports.getSandbox();

  string = string.replace(/ISODate\(/g, 'new ISODate(');

  vm.runInNewContext('doc = eval((' + string + '));', sandbox);

  return sandbox.doc;
};

exports.toSafeBSON = function (string) {
  try {
    var bsonObject = exports.toBSON(string);
    return bsonObject;
  }
  catch (err) {
    return null;
  }
};

exports.toObjectId = function (string) {
  var sandbox = exports.getSandbox();

  if (
    !string ||                                            // No input at all
    string === '' ||                                      // empty string
    string.toUpperCase().indexOf('OBJECTID(') === -1 ||   // missing the opening 'ObjectID('
    string.indexOf(')') === -1                            // missing the closing '('
  ) {
    return false;
  }

  string = string.replace('"', '').replace('"', '');

  string = string.replace(/ObjectID\(/i, '').replace(')', '');

  if (string.length === 24) {
    return sandbox.ObjectID(string);
  } else {
    return false;
  }
};

exports.toString = function (doc) {
  return json.stringify(doc, null, '    ');
};

exports.toJsonString = function (doc) {
  var sJson = json.stringify(doc, null);
  sJson = sJson.replace(/ObjectID\(/g, '');
  sJson = sJson.replace(/DBRef\(/g, '{ "$ref": ');
  sJson = sJson.replace(/ISODate\(/g, '');
  sJson = sJson.replace(/\)/g, '');
  return sJson;
};
