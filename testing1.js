const helper = require(__dirname + "/hubspot_helper");

exports.handler = (event, context, callback) => {
    helper.createRequest("/deals/v1/pipelines", "GET", null).then((data) => {
        var response = "";

        data[0].stages.forEach((stage) => {
            response = response + stage.label + ", ";
        });

        callback(null, {
            "dialogAction" : {
                "type" : "Close",
                "fulfillmentState" : "Fulfilled",
                "message" : {
                    "contentType" : "PlainText",
                    "content" : "Your stages are " + response
                }
            }
        });
    }).catch((err) => {
        console.error(err);
    });
};
