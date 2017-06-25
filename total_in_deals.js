/**
 * Intent: TotalInDeals
 *
 * Commands (Variations of commands are available. See Lex intent for details.)
 *
 * What is the total value of deals in the {stage}​ stage.
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

    // Create the request into hubspot using the helper.
    hubspot_helper.createRequest("/deals/v1/deal/paged?properties=dealstage&properties=amount", "GET", null).then((data) => {
        var total_amount = 0;
        var content   = "The total amount is ";

        // Loop through each of the deals and if one matches the id of the stage
        // then increase the counter.
        data.deals.forEach((deal) => {
            if(deal.properties.dealstage.value === stage_guid) {
                total_amount += parseInt(deal.properties.amount.value);
            }
        });

        content = content + total_amount + "dollars.";

        return lambda_helper.processCloseCallback(callback, "Fulfilled", content);
    }).catch((err) => {
        return lambda_helper.processCloseCallback(callback, "Failed", err.message);
    });
};
