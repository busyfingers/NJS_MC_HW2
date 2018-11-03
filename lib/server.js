/**
 * Server-related tasks
 */

var http = require("http");
var https = require("https");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./config");
var fs = require("fs");
var handlers = require("./handlers");
var helpers = require("./helpers");
var path = require("path");
var util = require("util");
var debug = util.debuglog("server");

// Instantiate the server module object
var server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer(function (req, res) {
    server.unifiedServer(req, res);
});

// Instantiate the HTTPS server
// server.httpsServeroptions = {
//     "key": fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
//     "cert": fs.readFileSync(path.join(__dirname, "/../https/cert.pem"))
// };
// server.httpsServer = https.createServer(server.httpsServeroptions, function (req, res) {
//     server.unifiedServer(req, res);
// });

// All the server logic for the http and https server
server.unifiedServer = function (req, res) {
    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, "")

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP Method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload if there is any
    var decoder = new StringDecoder("utf-8");
    var buffer = "";
    req.on("data", function (data) {
        buffer += decoder.write(data);
    });

    // The end event will always be called
    req.on("end", function () {
        buffer += decoder.end();

        // Choose the handler this request should go to
        // If one is not found, use the notFound handler
        let chosenHandler = typeof (server.router[trimmedPath]) !== "undefined" ? server.router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        let data = {
            "trimmedPath": trimmedPath,
            "queryStringObject": queryStringObject,
            "method": method,
            "headers": headers,
            "payload": helpers.parseJsonToObject(buffer)
        };

        // // Default to a green response message (successful)
        // let responseColor = "\x1b[32m%s\x1b[0m";
        // Initialize variable to hold the response message
        let responseMessage = `${method.toUpperCase()}/${trimmedPath}`;
        // // Initialize variable to hold the response result
        // let result = {};

        // Route the request to the handler specified in the router
        chosenHandler(data).then(handlerReturn => {
            res = server.handleResponse(handlerReturn.statusCode, handlerReturn.payload, res);
            // Set response color to red
            console.log("\x1b[32m%s\x1b[0m", `${responseMessage} ${handlerReturn.statusCode}`);
            res.end();        
        }).catch(handlerReturn => {
            res = server.handleResponse(handlerReturn.statusCode, handlerReturn.payload, res);
            // Set response color to red
            console.log("\x1b[31m%s\x1b[0m", `${responseMessage} ${handlerReturn.statusCode}`);
            res.end();
        })
        // .finally(() => {
        //     // Collect return values, print to console and end request
        //     responseMessage = result.msg;
        //     res = result.res;
        //     console.log(responseColor, responseMessage);
        //     res.end();
        // });

    });
};

server.handleResponse = (statusCode, payload, res) => {
    // Use the status code called back by the handler or default to 200
    statusCode = typeof (statusCode) == "number" ? statusCode : 200;

    // Use the payload called back by the handler or default to an empty object
    // If the status code is 500, do not show the caller the details of the internal error, 
    // log it instead
    if (typeof (payload) !== "object" || statusCode === 500) {  
        console.debug(statusCode, payload.error);
        payload = {};
    }
    //payload = typeof (payload) == "object" && statusCode !== 500 ? payload : {};

    // Convert the payload to a string
    var payloadString = JSON.stringify(payload);

    // Prepare the response
    res.setHeader("Content-Type", "application/json");
    res.writeHead(statusCode);
    res.write(payloadString);

    // Return the response
    return res;
} 

// Define a request router
server.router = {
    // "ping": handlers.ping,
    "users": handlers.users,
    // "tokens": handlers.tokens,
    // "checks": handlers.checks
};

// Init script
server.init = function () {
    // Create required folders if necessary
    // TODO: add all directories
    // TODO: put folder creation in separate function
    // TODO: define folder names in config.js
    if (!fs.existsSync("./.data")) fs.mkdirSync("./.data");
    if (!fs.existsSync("./.data/users")) fs.mkdirSync("./.data/users");
    if (!fs.existsSync("./.data/tokens")) fs.mkdirSync("./.data/tokens");
    if (!fs.existsSync("./.data/menu")) fs.mkdirSync("./.data/menu");

    // Start the HTTP server
    server.httpServer.listen(config.httpPort, function () {
        console.log("\x1b[36m%s\x1b[0m","The server is listening to port " + config.httpPort);
    });

    // Start the HTTPS server
    // server.httpsServer.listen(config.httpsPort, function () {
    //     console.log("\x1b[35m%s\x1b[0m", "The server is listening to port " + config.httpsPort);
    // });
};

// Export the server
module.exports = server;