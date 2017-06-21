exports.handler = (event, context, callback) => {
    callback(null, {
        "dialogAction" : {
            "type" : "Close",
            "fulfillmentState" : "Fulfilled",
            "message" : {
                "contentType" : "PlainText",
                "content" : "Lex Testing"
            }
        }
    });
};
