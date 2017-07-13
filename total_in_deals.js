/**
 * Intent:
 *   TotalInDeals
 *
 * Description:
 *   Getting the total value of deals in a specific stage.
 *
 * Slot Types:
 * 	 stage : {discovery, quote, negotiate, lost, won}
 *
 * Commands:
 *   What is the total value of deals in the {stage}​ stage.
 *   What is the total value of deals.
 */
const config         = require(__dirname + "/config/config.json");
const hubspot_helper = require(__dirname + "/helpers/hubspot_helper");
const lambda_helper  = require(__dirname + "/helpers/lambda_helper");

exports.handler = (event, context, callback) => {
    var slots = lambda_helper.parseSlots(event);

    /*
     * Stage
     */
    var stage_guid = null;
    var stage_name = slots.stage.value;

    // First check if there is a value in the slot.
    if(slots.stage.value === null) {
        return lambda_helper.processValidation(callback, event, "stage", "What type of stage would you like to query? I have discovery, quote, negotiate, lost, or won available.");
    }

    // Second loop through to see if it is a valid slot.
    config.stages.forEach((stage) => {
        if(stage_name.includes(stage.name) === true) {
            stage_guid = stage.guid;
        }
    });

    // Third if the slot was not found ask for it again.
    if(stage_guid === null) {
        return lambda_helper.processValidation(callback, event, "stage", "I did not understand that stage. I have discovery, quote, negotiate, lost, or won available.");
    }

    hubspot_helper.createRequest("/deals/v1/deal/paged?properties=dealstage&properties=amount", "GET", null).then((body) => {
        var total_amount = 0;
        var content      = null;

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
        content = `The total amount is ${total_amount} dollars.`;

        return lambda_helper.processCallback(callback, event, "Fulfilled", content);
    }).catch((err) => {
        return lambda_helper.processCallback(callback, event, "Failed", err.message);
    });
};
