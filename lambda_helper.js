exports.processCloseCallback = (callback, fulfillmentState, message) => {
    callback(null, {
        "dialogAction" : {
            "type" : "Close",
            "fulfillmentState" : fulfillmentState,
            "message" : {
                "contentType" : "PlainText",
                "content" : message
            }
        }
    });
};
