/**
 * Functions related to bootstrapping the server: creating required folders etc.
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");

// Instantiate the library object
lib = {};

lib.do = () => {
    return new Promise((resolve, reject) => {
        // Bootstrap the server and start it
        _data.getMenuItems().then(_ => {
            // Create required folders
            helpers.createRequiredFolders();
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
}

module.exports = lib;