// Includes for the hubspot helper.
const config   = require(__dirname + "/config/config.json");
const request  = require("request");
const bluebird = require("bluebird");

// Simple wrapper for creating a request in Node.
exports.createRequest = (path, method, body) => {
    // Setup the options for the request.
    var options = {
        "url"    : config.hubspot.base_url + path + "&hapikey=" + config.hubspot.api_key,
        "method" : method
    };

    // If there is going to be details passed into the body include them.
    // Otherwise do not put that in the request.
    if(body !== null) {
        options.form = body;
    }

    // Use bluebird to create a promise for the request. If there is an error
    // reject and let the client calling handle the rejection.
    return new bluebird((resolve, reject) => {
        request(options, (err, res, body) => {
            if(err) {
                reject(err)
            } else {
                resolve(JSON.parse(body));
            }
        });
    });
};
