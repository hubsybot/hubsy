// Includes for the hubspot helper.
const config   = require(__dirname + "/../config/config.json");
const request  = require("request");
const bluebird = require("bluebird");

// Simple wrapper for creating a request in Node.
exports.createRequest = (path, method, body) => {
    var url = config.hubspot.base_url + path + "&hapikey=" + config.hubspot.api_key + "&limit=5";
    console.log(url)
    // Setup the options for the request.
    var options = {
        "url"    : url,
        "method" : method
    };

    // If there is going to be details passed into the body include them.
    // Otherwise do not put that in the request.
    if(body !== null) {
        options.form = body;
    }

    function getData() {
        return new bluebird((resolve, reject) => {
            var data = [];

            function next(options) {
                request(options, (err, res, body) => {
                    if(err) {
                        reject(err)
                    } else {
                        body = JSON.parse(body);

                        data.push(body);

                        if(body.hasMore === true) {
                            options.url = url + "&offset=" + body.offset;

                            next(options);
                        } else {
                            resolve(data);
                        }
                    }
                });
            }

            next(options);
        });
    };

    return getData();
};
