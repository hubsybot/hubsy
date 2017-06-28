/**
 * Intent: TotalInDeals
 *
 * Commands (Variations of commands are available. See Lex intent for details.)
 *
 * What is the total value of deals in the {stage}​ stage.
 */

// Include the config and helpers.
const config         = require(__dirname + "/config/config.json");
const hubspot_helper = require(__dirname + "/helpers/hubspot_helper");
const lambda_helper  = require(__dirname + "/helpers/lambda_helper");

// Handler for the Lambda function.
exports.handler = (event, context, callback) => {
    var slots = lambda_helper.parseSlots(event);

    // Stage information.
    var stage_guid = null;
    var stage_name = slots.stage.value;

    // It's not exactly clear what stage name could come back in the slot
    // so we can just see if it includes one of our predefined ones.
    config.stages.forEach((stage) => {
        if(stage_name.includes(stage.name) === true) {
            stage_guid = stage.guid;
        }
    });

    // If it is not found then process a failed callback.
    if(stage_guid === null) {
        return lambda_helper.processCallback(callback, event, "Failed", "I am sorry but we could not find the stage " + stage_name);
    }

    // Create the request into hubspot using the helper.
    hubspot_helper.createRequest("/deals/v1/deal/paged?properties=dealstage&properties=amount", "GET", null).then((body) => {
        var total_amount = 0;
        var content   = "The total amount is ";

        // Loop through each of the deals and if one matches the id of the stage
        // then increase the counter.
        body.forEach((data) => {
            data.deals.forEach((deal) => {
                if(deal.properties.dealstage.value === stage_guid) {
                    total_amount += parseFloat(deal.properties.amount.value);
                }
            });
        });

        // Build the content to send back to Lex.
        content = content + total_amount + " dollars.";

        return lambda_helper.processCallback(callback, event, "Fulfilled", content);
    }).catch((err) => {
        return lambda_helper.processCallback(callback, event, "Failed", err.message);
    });
};
