/**
 * Server-related tasks
 */

const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config");
const handlers = require("./handlers");
const helpers = require("./helpers");
const path = require("path");
const util = require("util");
const debug = util.debuglog("server");

// Instantiate the server module object
let server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});

// All the server logic for the http and https server
server.unifiedServer = (req, res) => {
    // Get the URL and parse it
    let parsedUrl = url.parse(req.url, true);

    // Get the path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, "")

    // Get the query string as an object
    let queryStringObject = parsedUrl.query;

    // Get the HTTP Method
    let method = req.method.toLowerCase();

    // Get the headers as an object
    let headers = req.headers;

    // Get the payload if there is any
    let decoder = new StringDecoder("utf-8");
    let buffer = "";
    req.on("data", (data) => {
        buffer += decoder.write(data);
    });

    // The end event will always be called
    req.on("end", () => {
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

        // Initialize variable to hold the response message
        let responseMessage = `${method.toUpperCase()}/${trimmedPath}`;

        // Route the request to the handler specified in the router
        chosenHandler(data).then(handlerReturn => {
            res = server.handleResponse(handlerReturn.statusCode, handlerReturn.payload, res);
            // Set response color to green
            console.log("\x1b[32m%s\x1b[0m", `${responseMessage} ${handlerReturn.statusCode}`);
            res.end();        
        }).catch(handlerReturn => {
            res = server.handleResponse(handlerReturn.statusCode, handlerReturn.payload, res);
            // Set response color to red
            console.log("\x1b[31m%s\x1b[0m", `${responseMessage} ${handlerReturn.statusCode}`);
            res.end();
        })
    });
};

server.handleResponse = (statusCode, payload, res) => {
    // Use the status code called back by the handler or default to 200
    statusCode = typeof (statusCode) == "number" ? statusCode : 200;

    // Use the payload called back by the handler or default to an empty object
    // If the status code is 500, do not show the caller the details of the internal error, 
    // log it instead
    if (statusCode === 500) { 
        debug(statusCode, payload);
        payload = {};
    }

    // Convert the payload to a string
    let payloadString = JSON.stringify(payload);

    // Prepare the response
    res.setHeader("Content-Type", "application/json");
    res.writeHead(statusCode);
    res.write(payloadString);

    // Return the response
    return res;
} 

// Define a request router
server.router = {
    "users": handlers.users,
    "tokens": handlers.tokens,
    "menu": handlers.menu,
    "carts": handlers.carts,
    "orders": handlers.orders
};

// Init script
server.init = _ => {
    // Only start HTTPS server if a key and a certificate file could be found
    if (config.httpsKey && config.httpsCert) {
        // Instantiate the HTTPS server
        server.httpsServeroptions = {
            "key": config.httpsKey,
            "cert": config.httpsCert
        };
        server.httpsServer = https.createServer(server.httpsServeroptions, (req, res) => {
            server.unifiedServer(req, res);
        });

        // Start the HTTPS server
        server.httpsServer.listen(config.httpsPort, _ => {
            console.log("\x1b[35m%s\x1b[0m", `The server is listening to port ${config.httpsPort}`);
        });
    }

    // Start the HTTP server
    server.httpServer.listen(config.httpPort, _ => {
        console.log("\x1b[36m%s\x1b[0m",`The server is listening to port ${config.httpPort}`);
    });
};

// Export the server
module.exports = server;