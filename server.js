'use strict';
/**
 *  Mean container for dependency injection
 */
var mean = require('meanio');
mean.app('Mean Demo App',{});

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    passport = require('passport'),
    logger = require('mean-logger'),
    express = require('express');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Initializing system variables
var config = require('./server/config/config');
var db = mongoose.connect(config.db);


// Bootstrap Models, Dependencies, Routes and the app as an express app
var app = require('./server/config/system/bootstrap')(passport, db);


// Start the app by listening on <port>

app.listen(config.port);
console.log('HTTP redirect app started on port ' + config.port);

// SSL
// var https = require('https');
// var fs = require('fs');
// var ca = fs.readFileSync('cafile', 'utf8');
// var privateKey  = fs.readFileSync('privatekdy', 'utf8');
// var certificate = fs.readFileSync('certificate', 'utf8');
// var credentials = {ca: ca, key: privateKey, cert: certificate, passphrase: config.passphrase};
// https.createServer(credentials, app).listen(config.sslport);

// console.log('Express app started on port ' + config.sslport);

// // set up plain http server
// var httpRedirect = express();

// // set up a route to redirect http to https
// httpRedirect.get('*',function(req,res){  
// 	//console.log(req);
//     res.redirect('https://'+config.hostname+(config.sslport && config.sslport!=443?':'+config.sslport:'')+req.url)
// })

// // have it listen on 8080
// httpRedirect.listen(config.port);
// console.log('HTTP redirect app started on port ' + config.port);
// SSL end

// Initializing logger
logger.init(app, passport, mongoose);

// Expose app
exports = module.exports = app;
