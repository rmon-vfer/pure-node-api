/*
* Copyright - Ramón Vila Ferreres 2018
* ramonvilafer <at> gmail <dot> com

* Licensed under MIT license
* https://github.com/rmon-vfer/pure-node-api
*/

const config = require("./config"); // <-- Configuration file
const http = require("http");
const fs = require("fs");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;

// Instanciate HTTP server
const httpServer = http.createServer(function(req, res){ 
	unifiedServer(req, res)
});

// Start HTTP server
httpServer.listen(config.httpPort, function() { 
	console.log("[DEBUG] Servidor escuchando en el puerto " +
	config.httpPort + " en modo: " +config.envName); 
});

// Instanciate HTTPS server
var httpsServerOptions = {
	/*
	* To use HTTPS, generate a key.pem and cert.pem
	* using OpenSSL, and place them in the /https/
	* folder
	*/

	"key" : fs.readFileSync("./https/key.pem"), 
	"cert" : fs.readFileSync("./https/cert.pem")
};

const httpsServer = https.createServer(httpsServerOptions, 
	function(req, res){ 
		unifiedServer(req, res)
});

// Start HTTPS server
httpsServer.listen(config.httpsPort, 
	function() { 
		console.log("[DEBUG] Server listening on port: " + config.httpsPort + " in mode: " +config.envName); 
});

//Unify HTTPS and HTTP 
var unifiedServer = function(req, res){

	// Obtain and parse requested URL
	var parsedURL = url.parse(req.url, true);

	// Obtain path
	var path = parsedURL.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g,"");

	// Obtain received URL parameters as an object
	var parsedParams = parsedURL.query;

	// Obtain HTTP method 
	var method = req.method.toLowerCase();

	// Obtain request headers
	var headers = req.headers;

	// Obtain request body
	var decoder = new StringDecoder("utf-8");
	var requestBody = "";

	req.on("data", function(data){ 
	/*  When request body is not empty, decodify data as UTF-8 using callback, then add it
	*  to requestBody (which stores all the req body) */
		requestBody += decoder.write(data);
	});

	req.on("end", function(){
		/* The "end" event is triggered whenever http request finishes, then, received
		* data gets processed */
		
		requestBody += decoder.end(); // Close decoder Object

		/* Select the appropiate handler according to the requested path 
		* (router[trimmedPath]), if no handler is found, assign to "notFound"*/
		var chosenHandler = typeof(router[trimmedPath]) !== "undefined" ? router[trimmedPath] : router["notFound"]; 

		// Pack received data
		var requestData = {
			"trimmedPath" : trimmedPath,
			"parsedParams" : parsedParams, 
			"method" : method,
			"headers" : headers, 
			"requestBody" : requestBody 
		};

		// Use previously selected controller to proccess the path and send a response to user
		chosenHandler( requestData, function( statusCode, processedData ){

			statusCode = typeof(statusCode) == "number" ? statusCode : 200;
			processedData = typeof(processedData) == "object" ? processedData : {};

			// Stringify processed data to send it
			var processedDataString = JSON.stringify(processedData);
			res.setHeader("Content-Type", "aplication/json");
			res.writeHead(statusCode);

			// SEND the response to user
			res.end(processedDataString);

			////// DEBUG ///////
			console.log("[DEBUG] Code: ", statusCode);
			console.log("[DEBUG] Data: ", processedData);

		});
	});

};


// App route handlers
var handlers = {

	test : function(data, callback){
		
		// Process your data here

		callback(200, {
			/* Callback returns an status code and data 
			* 
			* Note that in this case, the data returned by
			* the callback is the JSON the user receives 
			*/ 
			"receivedData" : data,
			"status": "rainy but nice!"
		});
	},

	notFound : function(data, callback){
		callback(404, {
			"receivedData" : data,
			"error" : "NotFound"
		});
	}, 

	/*
	* Sample function which retrieves a word from the URL params
	* and then tries to open and return a JSON file with that
	* name (which contains the word definition).
	* Finally, it sends it to user
	*/
	define : function(data, callback){
		try {
			callback(200, // <-- Status code
			//  Parse JSON |  Read File |  JSON path |   URL params  |   word to define  | Encoding  
				JSON.parse(fs.readFileSync("./json/"+data["parsedParams"]["word"]+".json", "utf-8"))
				);

		} catch(err) { //<- If definition is not avalaible
		    callback(404, { // Send Status code "Not Found"
		    	// And an error message
				"error" : "definition not avalaible"
			});
		}
	}
};

/* 
* App router: object whose keys are the app routes and its values,
* the corresponding handler function
*/
var router = {
	"test" : handlers.test, 
	"notFound" : handlers.notFound,
	"define" : handlers.define
}