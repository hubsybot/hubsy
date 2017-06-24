// Include the hubspot helper.
const helper = require(__dirname + "/hubspot_helper");

// Handler for the lambda function.
exports.handler = (event, context, callback) => {
    var id    = null;
    var stage = event.currentIntent.slots.stage;

    // It's not exactly clear what stage name could come back in the slot
    // so we can just see if it includes one of our predefined ones.
    if(stage.includes("discovery") === true) {
        id = "appointmentscheduled";
    } else if(stage.includes("presentation") === true) {
        id = "qualifiedtobuy";
    } else if(stage.includes("quote") === true) {
        id = "presentationscheduled";
    } else if(stage.includes("negotite") === true) {
        id = "decisionmakerboughtin";
    }

    // Create the request into hubspot.
    helper.createRequest("/deals/v1/deal/paged?properties=dealstage", "GET", null).then((data) => {
        var num_deals = 0;

        // Loop through each of the deals and if one matches the id of the stage
        // then increase the counter.
        // @TODO this is paged so we will need to work with multiple pages.
        data.deals.forEach((deal) => {
            if(deal.properties.dealstage.versions[0].value === id) {
                ++num_deals;
            }
        });

        // Respond to Lex.
        callback(null, {
            "dialogAction" : {
                "type" : "Close",
                "fulfillmentState" : "Fulfilled",
                "message" : {
                    "contentType" : "PlainText",
                    "content" : "There are " + num_deals + " in the " + stage + " stage."
                }
            }
        });
    }).catch((err) => {
        console.error(err);
    });
};
