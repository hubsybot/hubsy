// Reference
// https://api.hubapi.com/deals/v1/deal/paged?hapikey=[Hubspot_API_Key]&properties=dealstage&properties=hubspot_owner_id

// Include the hubspot helper.
const helper = require(__dirname + "/hubspot_helper");

// Handler for the lambda function.
exports.handler = (event, context, callback) => {
    // Stage information.
    var stage_id = null;
    var stage    = event.currentIntent.slots.stage;

    // Sales information.
    var sales       = null;
    var sales_email = null;

    // It's not exactly clear what stage name could come back in the slot
    // so we can just see if it includes one of our predefined ones.
    if(stage.includes("discovery") === true) {
        stage_id = "appointmentscheduled";
    } else if(stage.includes("presentation") === true) {
        stage_id = "qualifiedtobuy";
    } else if(stage.includes("quote") === true) {
        stage_id = "presentationscheduled";
    } else if(stage.includes("negotite") === true) {
        stage_id = "decisionmakerboughtin";
    }

    // If there is a sales slot configured check to see who it is if is none of the
    // ones provided it was invalid and we can null the rest out.
    if(event.currentIntent.slots.sales !== null) {
        sales = event.currentIntent.slots.sales;

        if(sales.includes("john") === true) {
            sales_email = "johnswetzel@gmail.com";
        } else if(sales.includes("andy") === true) {
            sales_email = "andrewpuch@gmail.com";
        } else {
            sales       = null;
            sales_email = null;
        }
    }

    // Create the request into hubspot.
    helper.createRequest("/deals/v1/deal/paged?properties=dealstage&properties=hubspot_owner_id", "GET", null).then((data) => {
        var num_deals = 0;
        var content   = "";

        // Loop through each of the deals and if one matches the id of the stage
        // then increase the counter.
        // @TODO this is paged so we will need to work with multiple pages.
        data.deals.forEach((deal) => {
            if(deal.properties.dealstage.versions[0].value === stage_id && sales === null) {
                ++num_deals;
            } else if(deal.properties.dealstage.versions[0].value === stage_id && sales !== null && deal.properties.hubspot_owner_id.sourceId === sales_email) {
                ++num_deals;
            }
        });

        if(sales !== null) {
            content = "There are " + num_deals + " in the " + stage + " stage assigned to " + sales;
        } else {
            content = "There are " + num_deals + " in the " + stage + " stage.";
        }

        // Respond to Lex.
        callback(null, {
            "dialogAction" : {
                "type" : "Close",
                "fulfillmentState" : "Fulfilled",
                "message" : {
                    "contentType" : "PlainText",
                    "content" : content
                }
            }
        });
    }).catch((err) => {
        console.error(err);
    });
};
