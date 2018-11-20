/*
* Copyright - Ramón Vila Ferreres 2018
* ramonvilafer <at> gmail <dot> com

* Licensed under MIT license
* https://github.com/rmon-vfer/pure-node-api
*/

// Create and export ENV variables
var enviroments = {};

enviroments.staging =  {
	"httpPort" : 3000,
	"httpsPort" : 3001,
	"envName" : "staging" 
};

enviroments.production =  {
	"httpPort" : 5000,
	"httpsPort" : 5001,
	"envName" : "production"
};

// Determinate which enviroment has been received from CLI
var currentEnv = typeof(process.env.NODE_ENV) == "string" ? process.env.NODE_ENV.toLowerCase() : "";

// Check if the enviroment exists in the ENV object
var enviromentToExport = typeof(enviroments.currentEnv) == "object" ? enviroments.currentEnv : enviroments.staging;

// Export the module
module.exports = enviromentToExport;