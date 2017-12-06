var express = require("express");
var mongoose   = require('mongoose');
var path = require("path");
var favicon = require("static-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var app = express();
// express version 4 でセッションを使用するために必要
var session = require("express-session"); 
var config = require('./config.json')[app.get('env')];

// --------------------------------------------------------
// mongoose
// --------------------------------------------------------
mongoose.Promise = global.Promise;
mongoose.connect(config.MONGO_DB);
mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error: ' + err);
    process.exit(-1);
});

// --------------------------------------------------------
// passport
// --------------------------------------------------------
var passport = require("passport");
var TwitterStrategy = require("passport-twitter").Strategy;
var TWITTER_CONSUMER_KEY = config.TWITTER_CONSUMER_KEY;
var TWITTER_CONSUMER_SECRET = config.TWITTER_CONSUMER_SECRET;
var TWITTER_CALLBACK_URL = config.TWITTER_CALLBACK_URL;

app.set("passport", passport); // routes.jsで使用するために格納しておく

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new TwitterStrategy({
        consumerKey: TWITTER_CONSUMER_KEY,
        consumerSecret: TWITTER_CONSUMER_SECRET,
        callbackURL: TWITTER_CALLBACK_URL
    },
    function(token, tokenSecret, profile, done) {
        app.set("token", token); // routes.jsで使用するために格納しておく
        app.set("tokenSecret", tokenSecret); // routes.jsで使用するために格納しておく
        process.nextTick(function() {
            return done(null, profile);
        });
    }
));
// --------------------------------------------------------


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(favicon());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//Cross-Origin Resource Sharingを有効にする記述
app.use(function (req, res, next) {
    //console.log(req.headers.origin);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  //res.header('Access-Control-Allow-Credentials', true);
  //res.header('Access-Control-Max-Age', '86400');
  next();
});

// セッションを有効に設定する
// express version 4 でセッションを使用するために必要
app.use(session({
    secret: "SECRET"
}));

// passport
app.use(passport.initialize());
app.use(passport.session());

module.exports = app;
app.use(express.static('static'));

// ルーティング
var routes = require("./routes/routes");