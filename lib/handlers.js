/**
 * Request handlers
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const response = helpers.createHandlerResponse;
// const config = require("./config");

// The handlers object
let handlers = {};

// Users route
// Returns a status code and an object representing the handler return data
handlers.users = data => {
    return new Promise((resolve, reject) => {
        let acceptableMethods = ["post", "get", "put", "delete"];
        if (acceptableMethods.indexOf(data.method) > -1) {
            // Expect the handler sub methods to return an object with the following keys-values:
            // "statusCode": <number>
            // "payload": <object>
            // - "payload" contains the key "error" if an error occured
            handlers._users[data.method](data).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        } else {
            reject(response(405, {"error": `Invalid method: ${data.method}`}));
        }
    });
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, email, streetAddress, password, tosAgreement
// Optional data: none
handlers._users.post = (data) => {
    // Check that all the required field are filled out
    let firstName = typeof (data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof (data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let email = typeof (data.payload.email) == "string" && helpers.validateEmailAddress(data.payload.email.trim()) ? data.payload.email.trim() : false;
    let streetAddress = typeof (data.payload.streetAddress) == "string" && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;
    let password = typeof (data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    let tosAgreement = typeof (data.payload.tosAgreement) == "boolean" && data.payload.tosAgreement == true ? true : false;

    return new Promise((resolve, reject) => {
        if (firstName && lastName && email && streetAddress && password && tosAgreement) {
            // Make sure that the user doesn't already exist
            _data.read("users", email).then(_ => {
                reject(response(400, {"error": "A user with that email already exists" }));
            }).catch(err => {
                // Hash the password and proceed if there are no errors doing so
                let hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // Create the user object
                    var user = {
                        "firstName": firstName,
                        "lastName": lastName,
                        "email": email,
                        "address": streetAddress,
                        "hashedPassword": hashedPassword,
                        "tosAgreement": true
                    };

                    // Store the user
                    return _data.create("users", email, user);
                } else {
                    reject(response(500, {"error": "Could not hash the user's password"}));
                }
            }).then(() => {
                resolve(response(200));
            }).catch(err => { 
                // Errors caught here are internal so always return status code 500
                reject(response(500, {"error": err}));
            })
        } else {
            reject(response(400, {"error": "Missing required fields" }));
        }
    });
};

// Users - get
// Required data: email
// Optional data: none
handlers._users.get = function (data) {
    // Check that the email is valid
    let email = typeof (data.queryStringObject.email) == "string" && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;

    return new Promise((resolve, reject) => {
        if (email) {
            // // Get the token from the headers
            // var token = typeof (data.headers.token) == "string" ? data.headers.token : false;
            // // Verify that the given token is valid for the phone number
            // handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            //     if (tokenIsValid) {
            
            // Lookup the user
            
            _data.read("users", email).then(userData => {
                if (userData) {
                    // Remove the hashed password from the user object before returning it to the requester
                    delete userData.hashedPassword;
                    resolve(response(200, userData));
                } else {
                    reject(response(404, {"error": "User not found"}));
                }
            }).catch(_ => {
                reject(response(404, {"error": "User not found"}));
            });

            //     } else {
            //         callback(403, { "Error": "Missing required token in header or token is invalid" });
            //     }
            // });
        } else {
            reject(response(400, { "error": "Missing required field" }));
        }
    });
};

// Not found handler
handlers.notFound = () => {
    return new Promise((resolve, reject) => {
        reject(response(400, {"error": "Invalid route"}));
    })
};

// Export the handlers
module.exports = handlers;