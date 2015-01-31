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
var connectAssets = require('connect-assets');
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
 * Connect to MongoDB.
 */

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')]
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({ url: secrets.db, autoReconnect: true })
}));

/** CORS **/
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(function(req, res, next) {
  res.locals.user = req.user;
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
