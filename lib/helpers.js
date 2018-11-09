/**
 * Helper functions for various tasks
 */

// Dependencies
const crypto = require("crypto");
const config = require("./config");
const fs = require("fs");
const https = require("https");
const querystring = require("querystring");

// Container for the module (to be exported)
let lib = {};

// Create necessary folders on startup, if needed
lib.createRequiredFolders = () => {
    config.folderPaths.forEach(path => {
        if (!fs.existsSync(path)) fs.mkdirSync(path);
    });
}

// Parse a JSON string to an object and in all cases, without throwing
lib.parseJsonToObject = str => {
    try {
        return JSON.parse(str);
    } catch (error) {
        return {};
    }
}

// Determine if a provided e-mail is valid
lib.validateEmailAddress = email => {
    // TODO: implement this
    return email.length > 0;
}

// Create a SHA256 hashed string
lib.hash = str => {
    if (typeof (str) === "string" && str.length > 0) {
        return crypto.createHmac("sha256", config.hashingSecret).update(str).digest("hex");
    } else {
        return false;
    }
}

// Create a handler response
lib.createHandlerResponse = (statusCode, payload) => {
    // Default to empty object if function was called without a payload argument
    payload = typeof(payload) == "object" ? payload : {};
    return {"statusCode": statusCode, "payload": payload};
}

// Create a string of random alphanumeric characters of a given length
lib.createRandomString = strLength => {
    strLength = typeof(strLength) == "number" && strLength > 0 ? strLength : false;

    if (strLength) {
        // Define all the possible characters that could go into a string
        let possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

        // Start the final string
        let str = "";

        for (let i = 1; i <= strLength; i++) {
            // Append random character to final string
            str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        }

        return str;

    } else {
        return false;
    }
};

// Make sure all item counts in an item collection object is >= 0
lib.validateItemCounts = items => {
    if (typeof(items) == "object") {
        let keys = Object.keys(items);
        // Make sure the object has at least one key
        if (keys.length < 1) {
            console.log("len < 1")
            return false;
        }
        keys.forEach(key => {
            if (typeof(items[key]) !== "number" || items[key] < 0) {
                console.log("type: ", typeof(items[key]))
                console.log("a value < 0: ", items[key])
                return false;
            }
        });
        return true;
    } else {
        console.log("not an object")
        return false;
    }
}

// Send a create payment request to Stripe
lib.sendPayment = (amount, email) => {
    return new Promise((resolve, reject) => {
        let requestData = querystring.stringify({
            "amount": parseInt(amount.replace("$","") * 100), // The amount in cents
            "currency": config.stripe.currency,
            "source": config.stripe.source,
            "receipt_email": email
        });

        let requestOptions = {
            "protocol": "https:",
            "hostname": "api.stripe.com",
            "method": "POST",
            "path": "/v1/charges",
            "headers": {
                "Authorization": `Basic ${Buffer.from(config.stripe.apiKey).toString("base64")}`,
                "Content-Type" : "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(requestData)
            }
        };

        // Instantiate the request object
        let req = https.request(requestOptions, res => {
            // Grab the status of the sent request
            var status = res.statusCode;

            // Callback successfully if the request went through
            if (status == 200 || status == 201) {
                resolve(lib.createHandlerResponse(200));
            } else {
                reject(lib.createHandlerResponse(500, {"error": `Could not process payment, status code: ${status}`}));
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on("error", err => {
            reject(lib.createHandlerResponse(500, err));
        });

        // Add the data to the request
        req.write(requestData);

        // End the request
        req.end();
    });
}

// Export the module
module.exports = lib;