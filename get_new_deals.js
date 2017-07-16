/**
 * Intent:
 *   DealsInStage
 *
 * Description:
 *   Getting the number of deals that are in a specific stage of HubSpot.
 *
 * Slot Types:
 * 	 stage        : {discovery, quote, negotiate, lost, won}
 *   sales        : {andrew, andy, john}
 *   confirmation : {yes, no}
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
const time_helper    = require(__dirname + "/helpers/time_helper");
const moment         = require("moment");

exports.handler = (event, context, callback) => {
    var slots = lambda_helper.parseSlots(event);

    /*
     * Stage
     */

    // // First check if there is a value in the slot.
    // if(slots.stage.value === null) {
    //     return lambda_helper.processValidation(callback, event, "stage", "What type of stage would you like to query? I have discovery, quote, negotiate, lost, or won available.");
    // }

    hubspot_helper.createRequest("/deals/v1/deal/recent/created/?", "GET", null).then((body) => {
        var message   = "";
        console.log("body", body)
        console.log("body", body.results)

        // Loop through each of the deals and if one matches the id of the stage
        // then increase the counter.
        if(body.results == null) {
            message = "You have <br />" +
                'Zero <br />' +
                "new <br />" +
                'deals...<br />' +
                'Hubsy leave now./';

        } else {
            body.forEach((data) => {
                data.deals.forEach((deal) => {
                    console.log(deal)
                });
            });

            message = "I need to successfully break a line <br />" +
                "Continued Message '/n'" +
                "Still going /n" +
                "Hubsy leave now. '/n'"
        };


        return lambda_helper.processCallback(callback, event, "Fulfilled", message);
    }).catch((err) => {
        return lambda_helper.processCallback(callback, event, "Failed", err.message);
    });
};
