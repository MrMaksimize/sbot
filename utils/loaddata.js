// Downloads the latest courtdate CSV file and
// rebuilds the database. For best results, load nightly.
if (!process.env.NODE_ENV)
  var dotenv = require('dotenv').load();


var http = require('http');
var moment = require('moment');
var request = require('request');
var parse = require('csv-parse');
var Promise = require('bluebird');
var sha1 = require('sha1');

var Knex = require('knex');
var knex = Knex.initialize({
  client: 'pg',
  connection: process.env.DATABASE_URL
});

var loadData = function () {
  var yesterday = moment().subtract('days', 1).format('MMDDYYYY');
  var url = process.env.CSV_DL_URL;

  console.log('Downloading latest CSV file...');
  request.get(url, function(req, res) {
    console.log('Parsing CSV File...');
    parse(res.body, { delimiter: ',', columns: true }, function(err, rows) {
      if (err) {
        console.log('Unable to parse file: ', url);
        console.log(err);
        process.exit(1);
      }
      console.log('rows');
      console.log(rows);
      console.log('Extracting information...');
      var places = rows;
      recreateDB(places, function() {
        console.log('Database recreated! All systems are go.');
      });
    });
  });
};


var recreateDB = function(places, callback) {
  // inserts cases, 1000 at a time.
  var insertPlaces = function() {
    var chunks = chunk(places, 1000);
    return Promise.all(chunks.map(function(chunk) {
      return knex('places').insert(chunk);
    }));
  };

  knex.schema
    .dropTableIfExists('places')
    .then(createPlacesTable)
    .then(insertPlaces)
    //.then(createIndexingFunction)
    //.then(dropIndex)
    //.then(createIndex)
    .then(close)
    .then(function() {
      callback();
    });
};

var createPlacesTable = function() {
  return knex.schema.createTable('places', function(table) {
    table.string('contact_id', 100).primary();
    table.string('cat_id', 100);
    table.string('contact');
    table.string('category');
    table.string('subcat');
    table.string('phone');
    table.text('address');
    table.text('notes');
    table.text('url');
  });
};

// Creating an index for citation ids, stored in a JSON array
// Using this strategy: http://stackoverflow.com/a/18405706
var createIndexingFunction = function () {
  var text = ['CREATE OR REPLACE FUNCTION json_val_arr(_j json, _key text)',
              '  RETURNS text[] AS',
              '$$',
              'SELECT array_agg(elem->>_key)',
              'FROM   json_array_elements(_j) AS x(elem)',
              '$$',
              '  LANGUAGE sql IMMUTABLE;'].join('\n');
  return knex.raw(text);
};

var dropIndex = function() {
  var text = "DROP INDEX IF EXISTS citation_ids_gin_idx";
  return knex.raw(text);
};

var createIndex = function() {
  var text = "CREATE INDEX citation_ids_gin_idx ON cases USING GIN (json_val_arr(citations, 'id'))";
  return knex.raw(text);
};

var close = function() {
  return knex.client.pool.destroy();
};

var chunk = function(arr, len) {
  var chunks = [];
  var i = 0;
  var n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }

  return chunks;
};

// Do the thing!
loadData();
