/**
 * Helper functions for various tasks
 */

// Dependencies
const crypto = require("crypto");
const config = require("./config");
const fs = require("fs");

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

// Export the module
module.exports = lib;