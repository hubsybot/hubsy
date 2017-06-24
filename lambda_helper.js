// Wrapper for making a closing callback to Lambda.
exports.processCloseCallback = (callback, fulfillmentState, message) => {
    // Verify the developer passed a valid fulfillmentState.
    if(fulfillmentState !== "Failed" && fulfillmentState !== "Fulfilled") {
        fulfillmentState = "Failed";
        message = "You have provided an invalid fulfillment state. It must be either Failed or Fulfilled.";
    }

    // Send callback to Lex.
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
