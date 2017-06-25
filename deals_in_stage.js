/**
 * Intent: DealsInStage
 *
 * Commands (Variations of commands are available. See Lex intent for details.)
 *
 * How many deals are in the `{stage}` stage.
 * How many deals are in the `{stage}` assigned to `{sales}`.
 *
 * @TODO This is a paged call so we will need to work with multiple pages potentially.
 */

// Include the config and helpers.
const config         = require(__dirname + "/config/config.json");
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
    // so we can just see if it includes one of our predefined ones.
    config.stages.forEach((stage) => {
        if(stage_name.includes(stage.name) === true) {
            stage_guid = stage.guid;
        }
    });

    // If it is not found then process a failed callback.
    if(stage_guid === null) {
        return lambda_helper.processCloseCallback(callback, "Failed", "I am sorry but we could not find the stage " + stage_name);
    }

    // If there is a sales slot configured check to see who it is if is none of the
    // ones provided it was invalid and we can null the rest out.
    if(event.currentIntent.slots.sales !== null) {
        sales_name = event.currentIntent.slots.sales;

        // Loop through sales people and check for both first and last name.
        config.sales_people.forEach((person) => {
            if(sales_name.includes(person.first) === true || sales_name.includes(person.last) === true) {
                sales_email = person.email;
            }
        });

        // If the name got through and it is not found then just process a failed callback.
        if(sales_email === null) {
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
            if(deal.properties.dealstage.value === stage_guid && sales_name === null) {
                ++num_deals;
            } else if(deal.properties.dealstage.value === stage_guid && sales_name !== null && deal.properties.hubspot_owner_id.sourceId === sales_email) {
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
