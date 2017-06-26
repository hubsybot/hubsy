// Lex and Amazon Skills have slots in different ways. This helper will parse
// them and return them to you. Agnostic of what the slot types are it will
// map them properly and give you a common object back.
exports.parseSlots = (event) => {
    var slots = {};

    // Parse Amazon Skill slots.
    if(event.request !== undefined) {
        for(var key in event.request.intent.slots) {
            // Keep types the same.
            if(event.request.intent.slots[key].value === undefined) {
                event.request.intent.slots[key].value = null;
            }

            slots[key] = {
                name : key,
                value : event.request.intent.slots[key].value
            };
        };
    }

    // Parse Lex slots.
    if(event.currentIntent !== undefined) {
        for(var key in event.currentIntent.slots) {
            // Keep types the same.
            if(event.currentIntent.slots[key] === undefined) {
                event.currentIntent.slots[key] = null;
            }

            slots[key] = {
                name : key,
                value : event.currentIntent.slots[key]
            };
        }
    }

    return slots;
};

// Wrapper for making a closing callback to Lambda.
exports.processCallback = (callback, event, fulfillmentState, message) => {
    // Verify the developer passed a valid fulfillmentState.
    if(fulfillmentState !== "Failed" && fulfillmentState !== "Fulfilled") {
        fulfillmentState = "Failed";
        message = "You have provided an invalid fulfillment state. It must be either Failed or Fulfilled.";
    }

    // Send back to Alexa Skill if there is an event.version. Otherwise
    // we know there is an event.messageVersion which is for Lex.
    if(event.version === undefined) {
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
    } else {
        callback(null, {
            version : '1.0',
            sessionAttributes : {},
            response : {
                outputSpeech: {
                    type : 'PlainText',
                    message : message,
                },
                card : {
                    type : 'Simple',
                    title : "testing",
                    content : message,
                },
                shouldEndSession : true,
            },
        });
    }
};
