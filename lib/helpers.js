/**
 * Helper functions for various tasks
 */

// Dependencies
const crypto = require("crypto");
const config = require("./config");

// Container for the module (to be exported)
let lib = {};

// Parse a JSON string to an object and in all cases, without throwing
lib.parseJsonToObject = (str) => {
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

// Export the module
module.exports = lib;