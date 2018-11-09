/**
 * Create and export confoguration variables
 */

// Container for all the environments
var environments = {};

// Staging object
environments.staging = {
    "httpPort" : 3000,
    "httpsPort" : 3001,
    "envName" : "staging",
    "hashingSecret" : "This is a secret",
    "maxChecks" : 5,
    "folderPaths": ["./.data/users", "./.data/tokens", "./.data/carts", "./.data/orders", "./.data/menu", "./.https"],
    "stripe": {
        "currency": "usd",
        "source": "tok_visa",
        "apiKey": "sk_test_4eC39HqLyjWDarjtT1zdp7dc" // this is public and for testing only
    }
};

// Production object
environments.production = {
    "httpPort" : 5000,
    "httpsPort" : 5001,
    "envName" : "production",
    "hashingSecret" : "This is also a secret",
    "maxChecks" : 5,
    "folderPaths": ["./.data/users", "./.data/tokens", "./.data/carts", "./.data/orders", "./.data/menu", "./.https"],
    "stripe": {
        "currency": "usd",
        "source": "",
        "apiKey": ""
    }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == "string" ? process.env.NODE_ENV.toLowerCase() : "";

// Check that the current environment is defined above, if not, default is staging
var environmentToExport = typeof(environments[currentEnvironment]) == "object" ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;