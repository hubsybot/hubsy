/**
 * Intent: DealsInStage
 *
 * Commands (Variations of commands are available. See Lex intent for details.)
 *
 * How many deals are in the `{stage}` stage.
 * How many deals are in the `{stage}` assigned to `{sales}`.
 *
 * @TODO This is a paged call so we will need to work with multiple pages potentially.
 * @TODO Put the stages and sales people's names inside of the config and loop through for validations.
 */

// Include the hubspot helper.
const hubspot_helper = require(__dirname + "/hubspot_helper");
const lambda_helper  = require(__dirname + "/lambda_helper");

// Handler for the Lambda function.
exports.handler = (event, context, callback) => {
    // Stage information.
    var stage_guid = null;
    var stage_name = event.currentIntent.slots.stage;

    // Sales information.
    var sales_email = null;
    var sales_name  = null;

    // It's not exactly clear what stage name could come back in the slot
    // so we can just see if it includes one of our predefined ones. If it is not
    // found then process a failed callback.
    if(stage_name.includes("discovery") === true) {
        stage_guid = "a3984851-1f56-430b-b263-114bc22b3382";
    } else if(stage_name.includes("quote") === true) {
        stage_guid = "db49bacc-bd60-411c-9aa8-0a6d7672ef5b";
    } else if(stage_name.includes("negotiate") === true) {
        stage_guid = "ae7bc41b-d7c1-40a2-be38-fba6da1a9d73";
    } else if(stage_name.includes("lost") === true) {
        stage_guid = "8a5b5eb3-8a8f-4f02-8b77-1c52c5854ec5";
    } else if(stage_name.includes("won") === true) {
        stage_guid = "1ee69bb3-ccc0-44a0-bf43-c6708087ce20";
    } else {
        return lambda_helper.processCloseCallback(callback, "I am sorry but we could not find the stage " + stage_name);
    }

    // If there is a sales slot configured check to see who it is if is none of the
    // ones provided it was invalid and we can null the rest out.
    if(event.currentIntent.slots.sales !== null) {
        sales_name = event.currentIntent.slots.sales;

        // We will check for both first and last name. If the name got through and
        // it is not found then just process a failed callback.
        if(sales_name.includes("john") === true || sales_name.includes("wetzel") === true) {
            sales_email = "johnswetzel@gmail.com";
        } else if(sales_name.includes("andy") === true || sales_name.includes("puch") === true) {
            sales_email = "andrewpuch@gmail.com";
        } else {
            return lambda_helper.processCloseCallback(callback, "Failed", "I am sorry but we could not find the sales person " + sales_name);
        }
    }

    // Create the request into hubspot using the helper.
    hubspot_helper.createRequest("/deals/v1/deal/paged?properties=dealstage&properties=hubspot_owner_id", "GET", null).then((data) => {
        var num_deals = 0;
        var content   = "";

        // Loop through each of the deals and if one matches the id of the stage
        // then increase the counter.
        data.deals.forEach((deal) => {
            if(deal.properties.dealstage.versions[0].value === stage_guid && sales_name === null) {
                ++num_deals;
            } else if(deal.properties.dealstage.versions[0].value === stage_guid && sales_name !== null && deal.properties.hubspot_owner_id.sourceId === sales_email) {
                ++num_deals;
            }
        });

        // Build the content to send back to Lex.
        if(sales_name !== null) {
            content = "There are " + num_deals + " in the " + stage_name + " stage assigned to " + sales_name;
        } else {
            content = "There are " + num_deals + " in the " + stage_name + " stage.";
        }

        return lambda_helper.processCloseCallback(callback, "Fulfilled", content);
    }).catch((err) => {
        return lambda_helper.processCloseCallback(callback, "Failed", err.message);
    });
};
