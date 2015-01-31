var crypto = require('crypto');
var Knex = require('knex');
var Promise = require('bluebird');
var secrets = require('./config/secrets.js');
var knex = Knex.initialize({
  client: 'pg',
  connection: secrets.pgDb
});

exports.findCitation = function(citation, callback) {
  // Postgres JSON search based on prebuilt index
  citation = escapeSQL(citation.toUpperCase());
  var citationSearch = knex.raw("'{\"" + citation + "\"}'::text[] <@ (json_val_arr(citations, 'id'))");
  knex('cases').where(citationSearch).select().exec(callback);
};

exports.findPlaceFuzzy = function(str) {
  var searchQuery = str.toUpperCase();
  return knex('places').where('contact', 'like', '%' + searchQuery + '%')
    .orWhere('category', 'like', '%' + searchQuery + '%')
    .orWhere('subcat', 'like', '%' + searchQuery + '%');

};

exports.addReminder = function(data, callback) {
  var cipher = crypto.createCipher('aes256', secrets.twilio.encryptionKey);
  var encryptedPhone = cipher.update(data.phone, 'utf8', 'hex') + cipher.final('hex');

  knex('reminders').insert({
    case_id: data.caseId,
    sent: false,
    phone: encryptedPhone,
    created_at: new Date(),
    original_case: data.originalCase,
  }).exec(callback);
};

exports.addQueued = function(data, callback) {
  var cipher = crypto.createCipher('aes256', secrets.twilio.encryptionKey);
  var encryptedPhone = cipher.update(data.phone, 'utf8', 'hex') + cipher.final('hex');

  knex('queued').insert({
    citation_id: data.citationId,
    sent: false,
    phone: encryptedPhone,
    created_at: new Date(),
  }).exec(callback);
};

var escapeSQL = function(val) {
  val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
    switch(s) {
      case "\0": return "\\0";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\b": return "\\b";
      case "\t": return "\\t";
      case "\x1a": return "\\Z";
      default: return "\\"+s;
    }
  });
  return val;
};
