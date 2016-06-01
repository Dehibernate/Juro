var cors = require('cors');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var SuperLogin = require('superlogin');
var app = express();
var request = require('request');

app.use(morgan('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: false }));

var config = {
	testMode: {
		debugEmail: false
	},

	//Make sure the dbServer options match your local CouchDB configuration
	dbServer: {
		protocol: 'http://',
		host: 'localhost:5985',
		user: 'dehibernate',
		password: 'tintin',
		userDB: 'sl-users',
		couchAuthDB: '_users'
	},
	mailer: {
		fromEmail: 'username@gmail.com',
		options: {
			service: 'gmail',
			secureConnection:true,
			auth: {
				user: 'username@gmail.com',
				pass: 'password'
			}
		}
	},

	local: {
	    // Send out a confirm email after each user signs up with local login
	    sendConfirmEmail: true,
	    // Require the email be confirmed before the user can login
	    requireEmailConfirm: true
	},

	userDBs: {
		defaultDBs: {
			private: ['supertest']
		}
	}
}

//Initialize SuperLogin
var superlogin = new SuperLogin(config);

//Setup CORS
var corsOptions = {
	origin: 'http://localhost:8100',
	credentials: true,
};
app.use(cors(corsOptions));

//Add Superlogin routes
app.use('/auth/', superlogin.router);

//Reverse proxy redirect all db calls to CouchDB
app.use('/',
	function(req,res,next) {
  //If user is not accessing a configuration database/url (e.g. /_users, /_utils) redirect to CouchDB
  if(require('url').parse(req.url).path.match(/^(\/+)[^_](.*)$/)){
  	request({ 
  		url:('http://localhost:5985/' + require('url').parse(req.url).path),
  		headers: req.headers,
  		method: req.method,
  		body: JSON.stringify(req.body)
  	},function(err,remoteResponse,remoteBody){
  		if(err) {
  			res.sendStatus(500);
  		}else{
  			res.headers = remoteResponse.headers;
  			res.body = remoteBody;
  			res.statusCode = remoteResponse.statusCode;
  			res.statusMessage = remoteResponse.statusMessage;
  			res.send(remoteBody);
  			console.log("PROXY",req.method,require('url').parse(req.url).path,remoteResponse.statusCode);
  		}
  	});
  }else{
  	console.log("Restricted url. Blocking access. ",require('url').parse(req.url).path);
  	res.sendStatus(401);
  }
});

//Start HTTP server
http.createServer(app).listen(3000, function(){
	console.log("Server listening on port 3000");
});

////The code below enables HTTPS using a local SSL certificate
////Make sure to comment out the lines 93-95 to avoid ports clashing
//var https = require("https");
//var fs = require("fs");

//var credentials = {
//	key: fs.readFileSync('key.pem'),
//	cert: fs.readFileSync('certificate.pem')
//};

////Start HTTPS server
//https.createServer(credentials, app).listen(3000, function(){
// console.log("Server listening on port 3000");
//});