/**
 * Primary file of the REST API
 */

// Dependencies
const server = require("./lib/server");

// TODO: remove this
const _data = require("./lib/data");

// Declare the app
let app = {};

// Init function
app.init = () => {
    // Start the server
    server.init();

/* // Test code
    _data.create("test", "testing1", {"data:": "some data"}).then(() => {
        console.log("File created successfully");
        return _data.read("test", "testing1");       
    }).then(data => {
        console.log("Got data from file: ", data);
        return _data.update("test", "testing1", {"data": "new data"});
    }).then(() => {
        console.log("File updated successfully");
        return _data.read("test", "testing1");      
    }).then(data => {
        console.log("Got data from file: ", data);
        return _data.list("test");
    }).then(files => {
        console.log("Files: ", files);  
        return _data.delete("test", "testing1");
    }).then(() => {
        console.log("File deleted successfully");
    }).catch(err => {
        console.log("Error doing file operation: ", err);
    });
 */
};

// Execute
app.init();

// Export the app
module.exports = app;