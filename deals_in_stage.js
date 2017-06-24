// API reference for this intent.
// https://api.hubapi.com/deals/v1/deal/paged?hapikey=[Hubspot_API_Key]&properties=dealstage&properties=hubspot_owner_id

// Include the hubspot helper.
const hubspot_helper = require(__dirname + "/hubspot_helper");
const lambda_helper  = require(__dirname + "/lambda_helper");

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
        stage_id = "a3984851-1f56-430b-b263-114bc22b3382";
    } else if(stage.includes("quote") === true) {
        stage_id = "db49bacc-bd60-411c-9aa8-0a6d7672ef5b";
    } else if(stage.includes("negotiate") === true) {
        stage_id = "ae7bc41b-d7c1-40a2-be38-fba6da1a9d73";
    } else if(stage.includes("lost") === true) {
        stage_id = "8a5b5eb3-8a8f-4f02-8b77-1c52c5854ec5";
    } else if(stage.includes("won") === true) {
        stage_id = "1ee69bb3-ccc0-44a0-bf43-c6708087ce20";
    } else {
        return lambda_helper.processCloseCallback(callback, "I am sorry but we could not find the stage " + stage);
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
            return lambda_helper.processCloseCallback(callback, "Failed", "I am sorry but we could not find the sales person " + sales);
        }
    }

    // Create the request into hubspot.
    hubspot_helper.createRequest("/deals/v1/deal/paged?properties=dealstage&properties=hubspot_owner_id", "GET", null).then((data) => {
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

        // Build the content to send back to Lex.
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
