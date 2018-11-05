/**
 * Request handlers
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const response = helpers.createHandlerResponse; // For shorter statements where this is used
// const config = require("./config");

// The handlers object
let handlers = {};

// Returns a suitable main handling function for a given route
// Caller specifies the acceptable HTTP methods and which functions ("submethods") to map them against
handlers.mainHandler = (subMethodContainer, acceptableMethods) => {
    return (data) => {
        return new Promise((resolve, reject) => {
            if (acceptableMethods.indexOf(data.method) > -1) {
                // Expect the handler sub methods to return an object with the following keys-values:
                // "statusCode": <number>
                // "payload": <object>
                // - "payload" contains the key "error" if an error occured
                handlers[subMethodContainer][data.method](data).then(result => {
                    resolve(result);
                }).catch(err => {
                    reject(err);
                });
            } else {
                reject(response(405, { "error": `Invalid method: ${data.method}` }));
            }
        });
    };
}

// -----------------------------
// Handler methods for: /users
// -----------------------------

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
                reject(response(400, { "error": "A user with that email already exists" }));
            }).catch(_ => {
                // Hash the password and proceed if there are no errors doing so
                let hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // Create the user object
                    let user = {
                        "firstName": firstName,
                        "lastName": lastName,
                        "email": email,
                        "streetAddress": streetAddress,
                        "hashedPassword": hashedPassword,
                        "tosAgreement": true
                    };

                    // Store the user
                    return _data.create("users", email, user);
                } else {
                    reject(response(500, { "error": "Could not hash the user's password" }));
                }
            }).then(_ => {
                resolve(response(200));
            }).catch(err => {
                // Errors caught here are internal so return status code 500
                reject(response(500, { "error": err }));
            })
        } else {
            reject(response(400, { "error": "Missing required fields" }));
        }
    });
}

// Users - get
// Required data: email
// Optional data: none
handlers._users.get = (data) => {
    // Check that the email is valid
    let email = typeof (data.queryStringObject.email) == "string" && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;

    return new Promise((resolve, reject) => {
        if (email) {
            // Get the token from the headers
            var token = typeof (data.headers.token) == "string" ? data.headers.token : false;
            // Verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, email).then(_ => {
                // Everything OK, continue on to the next "then" in the promise chain
                return Promise.resolve();
            }).catch(_ => {
                reject(response(403, { "error": "Missing required token in header or token is invalid" }));
            }).then(_ => {
                // Lookup the user
                return _data.read("users", email);
            }).then(userData => {
                // Remove the hashed password from the user object before returning it to the requester
                delete userData.hashedPassword;
                resolve(response(200, userData));
            }).catch(_ => {
                // If userData is falsy above, we will end up here
                reject(response(404, { "error": "User not found" }));
            });         
        } else {
            reject(response(400, { "error": "Missing required field" }));
        }
    });
};

// Users - put
// Required data: email
// Optional data: firstName, lastName, streetAddress, password (at least one must be specified)
handlers._users.put = (data) => {
    // Check for the required field
    let email = typeof (data.queryStringObject.email) == "string" && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;

    // Check for the optional fields
    let firstName = typeof (data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof (data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let streetAddress = typeof (data.payload.streetAddress) == "string" && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;
    let password = typeof (data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    return new Promise((resolve, reject) => {
        // Error if the phone is invalid in all cases
        if (email) {
            // Error if nothing is sent to update
            if (firstName || lastName || streetAddress || password) {
                // Get the token from the headers
                var token = typeof (data.headers.token) == "string" ? data.headers.token : false;
                // Verify that the given token is valid for the phone number
                handlers._tokens.verifyToken(token, email).then(_ => {
                    // Everything OK, continue on to the next "then" in the promise chain
                    return Promise.resolve();
                }).catch(_ => {
                    reject(response(403, { "error": "Missing required token in header or token is invalid" }));
                }).then(_ => {
                    // Lookup the user
                    return _data.read("users", email);
                }).then(userData => {
                    // Update the fields necessary
                    if (firstName) {
                        userData.firstName = firstName;
                    }
                    if (lastName) {
                        userData.lastName = lastName;
                    }
                    if (streetAddress) {
                        userData.streetAddress = streetAddress;
                    }
                    if (password) {
                        userData.hashedPassword = helpers.hash(password);
                    }
                    // Done, continue on to the next "then" in the promise chain
                    return Promise.resolve(userData);
                }).catch(_ => {
                    reject(response(400, { "error": "The specified user does not exist" }));
                }).then(userData => {
                    // Store the new update
                    return _data.update("users", email, userData);
                }).then(_ => {
                    resolve(response(200));
                }).catch(err => {
                    // Errors caught here are internal so return status code 500
                    reject(response(500, { "error": err }));
                });
            } else {
                reject(response(400, { "error": "Missing field to update" }));
            }
        } else {
            reject(response(400, { "error": "Missing required field" }));
        }
    });
}

// Main handler for /users
// Returns a status code and an object representing the handler return data
handlers.users = handlers.mainHandler("_users", ["post", "get", "put", "delete"]);

// -----------------------------
// Handler methods for: /tokens
// -----------------------------

// Container for all the tokens submethods
handlers._tokens = {};

// Main handler for /tokens
// Returns a status code and an object representing the handler return data
handlers.tokens = handlers.mainHandler("_tokens", ["post", "get", "put", "delete"]);

// Tokens - post
// Required data: email, password
// Optional data: none
handlers._tokens.post = (data) => {
    let email = typeof (data.payload.email) == "string" && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    let password = typeof (data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    let tokenObject = {};

    return new Promise((resolve, reject) => {
        if (email && password) {
            // Lookup the user who matches the email
            _data.read("users", email).then(userData => {
                // Hash the sent password and compare it to the password stored in the user object
                let hashedPassword = helpers.hash(password);

                if (hashedPassword == userData.hashedPassword) {
                    // If valid, create new token with random name. Set expiration date 1 hour in the future
                    return {
                        "email": email,
                        "id": helpers.createRandomString(20),
                        "expires": Date.now() + 1000 * 60 * 60
                    };
                } else {
                    reject(response(400, { "error": "Password did not match the specified user's stored password" }));
                }
            }).catch(_ => {
                // If userData is falsy above, we will end up here
                reject(response(404, { "error": "User not found" }));
            }).then(tokenData => {
                // Assign tokenData to variable in function scope so that it is accessible further down the promise chain              
                tokenObject = tokenData;
                // Store the token
                return _data.create("tokens", tokenData.id, tokenData);
            }).then(_ => {
                resolve(response(200, tokenObject));
            }).catch(err => {
                // Errors caught here are internal so always return status code 500
                reject(response(500, { "error": err }));
            });
        }
    });
}

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, email) => {
    return new Promise((resolve, reject) => {
        // Lookup the token
        _data.read("tokens", id).then(tokenData => {
            // Check that the token is for the given user and has not expired
            if (tokenData.email == email && tokenData.expires > Date.now()) {
                resolve();
            } else {
                reject();
            }
        }).catch(_ => {
            // If tokenData is falsy above, we will end up here
            reject();
        });
    });
}

// Not found handler
handlers.notFound = () => {
    return new Promise((resolve, reject) => {
        reject(response(400, { "error": "Invalid route" }));
    })
}

// Export the handlers
module.exports = handlers;