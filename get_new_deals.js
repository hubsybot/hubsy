/**
 * Intent:
 *   get_new_deals
 *
 * Description:
 *   Getting the number of deals that are in a specific stage of HubSpot.
 *
 * Slot Types:
 *   stage        : {discovery, quote, negotiate, lost, won}
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
     * Check for new deals
     */

    // https://developers.hubspot.com/docs/methods/deals/get_deals_created
    hubspot_helper.createRequest("/deals/v1/deal/recent/created/?", "GET", null).then((body) => {
        var messages = "";
        var header   = "";

        if(body[0].results == null) {
            message = `There are no new deals. Should I start cracking the robot whip on sales?`

        } else {
            var deals_total = 0;
            var deals       = [];

            body.forEach((data) => {
                deals_total = data.total;
                data.results.forEach((deal) => {
                    var name       = deal.properties.dealname.value;
                    var amount     = deal.properties.amount.value;
                    var owner      = deal.properties.hubspot_owner_id.sourceId;
                    var stage_guid = deal.properties.dealstage.value;
                    var stage      = null;
                    
                    // Map stage guid to stage name.
                    config.stages.forEach((stage) => {
                        if(stage_guid == stage.guid) {
                            stage = stage.name;
                        };
                    });

                    deals.push(`Deal titled: ${name} owned by ${owner} worth $${amount} in ${stage} stage.`);
                });
            });

            header = `There are a total of ${deals_total} new deal(s). Here are some of the most recent:\n`;
            message = header + deals.join("\n");
        };

        return lambda_helper.processCallback(callback, event, "Fulfilled", message);
    }).catch((err) => {
        return lambda_helper.processCallback(callback, event, "Failed", err.message);
    });
};
