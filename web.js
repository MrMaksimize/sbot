/**
 * Module dependencies.
 */
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var methodOverride = require('method-override');

var secrets = require('./config/secrets');
var _ = require('lodash');
var S = require('string');
var MongoStore = require('connect-mongo')(session);
var path = require('path');
var Keen = require('keen.io');
var twilio = require('twilio');
var moment = require('moment');
var Promise = require('bluebird');
var db = require('./db');

/**
 * Keen Config
 */
var keenClient = Keen.configure({
  projectId: secrets.keen.projectId,
  writeKey: secrets.keen.writeKey
});



/**
 * Controllers (route handlers).
 */
/*var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');*/
var apiController = '';


/**
 * Create Express server.
 */
var app = express();

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({ url: secrets.mongoDb, autoReconnect: true })
}));

/** CORS **/
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals.S = S;
  next();
});


app.use(function(req, res, next) {
  if (/api/i.test(req.path)) req.session.returnTo = req.path;
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', function(req, res) {
  return res.render('home', {
    title: 'Home'
  });
});

// Fuzzy search that returns cases with a partial name match or
// an exact citation match
app.get('/search', function(req, res) {
  if (!req.query || !req.query.q) return res.send(400);
  db.findPlaceFuzzy(req.query.q).then(function(results) {
    //return res.json(results);
    return res.render('search', {
      title: 'Search results for: ' + req.query.q,
      results: results
    });
  });
});

app.get('/sms', function(req, res) {
  var twiml = new twilio.TwimlResponse();
  var text = req.query.Body.toUpperCase();
  db.findPlaceFuzzy(text).then(function(result) {
    var firstRec = _.first(result);
    var resCount = result.length;
    twiml.message('I think you\'re looking for ' + firstRec.contact + '. You can reach them by calling ' + firstRec.phone + ' or going to their site: ' + firstRec.url + '. They are located at ' + firstRec.address + '.');
    twiml.message('If this is not what you are looking for, see the rest of the ' + resCount + ' results here: http://sandbot.herokuapp.com/search?q=' + text.toLowerCase);
    //twiml.message('FYI - this is off the top of my head, I have ' + (resCount - 1) + ' more potential results, but I\'m still dumb.  I do have big dreams and hope to soon become more than a product of insomnia.');
    // Deploy to keen, return msg:
    keenClient.addEvent('searches', { search: text }, function() {
      return res.send(twiml.toString());
    });
  });
});


/**
 * API examples routes.
 */
//app.get('/api', apiController.getApi);

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
