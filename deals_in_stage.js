/**
 * Intent:
 *   DealsInStage
 *
 * Description:
 *   Getting the number of deals that are in a specific stage of HubSpot.
 *
 * Slot Types:
 * 	 stage        : {null, discovery, quote, negotiate, lost, won}
 *   sales        : {null, andrew, andy, john}
 *   confirmation : {null, yes, no}
 *
 * Commands:
 *   How many deals are in the {stage} stage.
 *   How many deals are in the {stage} assigned to {sales}.
 *   Give me the count of deals.
 *   What are the number of deals.
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

    /*
     * Sales
     */
    var sales_email = null;
    var sales_name  = slots.sales.value;

    // First check if there is a value in the slot.
    if(slots.confirmation.value === null) {
        if(slots.sales.value === null) {
            return lambda_helper.processValidation(callback, event, "confirmation", "Would you like to query for a sales persons assigned deals?");
        }
    }

    // Second check if the user does or does not want to look for a sales person.
    // This will also validate the confirmation word.
    if(slots.confirmation.value !== "yes" && slots.confirmation.value !== "no") {
        return lambda_helper.processValidation(callback, event, "confirmation", "I'm sorry I did not understand your confirmation. Please provide yes or no.");
    }

    // If they said yes lets look for a sales person.
    // This will also validate the sales person they are requesting.
    // Otherwise we will go and query HubSpot.
    if(slots.confirmation.value === "yes") {
        if(slots.sales.value === null) {
            return lambda_helper.processValidation(callback, event, "sales", "What sales person's deals would you like to look up?");
        } else {
            config.sales_people.forEach((person) => {
                if(sales_name.includes(person.first) === true || sales_name.includes(person.last) === true) {
                    sales_email = person.email;
                }
            });

            if(sales_email === null) {
                return lambda_helper.processValidation(callback, event, "confirmation", "I'm sorry I did not understand your sales person. Please ask for a sales person in your HubSpot.");
            }
        }
    }

    hubspot_helper.createRequest("/deals/v1/deal/paged?properties=dealstage&properties=hubspot_owner_id", "GET", null).then((body) => {
        var num_deals = 0;
        var content   = null;

        // Loop through each of the deals and if one matches the id of the stage
        // then increase the counter.
        body.forEach((data) => {
            data.deals.forEach((deal) => {
                if(deal.properties.dealstage.value === stage_guid && sales_name === null) {
                    ++num_deals;
                } else if(deal.properties.dealstage.value === stage_guid && sales_name !== null && deal.properties.hubspot_owner_id.sourceId === sales_email) {
                    ++num_deals;
                }
            });
        });

        if(sales_name !== null) {
            content = `There are ${num_deals} in the ${stage_name} stage assigned to ${sales_name}.`;
        } else {
            content = `There are ${num_deals} in the ${stage_name} stage.`;
        }

        return lambda_helper.processCallback(callback, event, "Fulfilled", content);
    }).catch((err) => {
        return lambda_helper.processCallback(callback, event, "Failed", err.message);
    });
};
