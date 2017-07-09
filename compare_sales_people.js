/**
 * Intent:
 *   CompareSalesPeople
 *
 * Description:
 *   Comparing sales people will take a specific engagement type, 2 sales people,
 *   and a timeframe. Look up the amount of times that engagement happened and
 *   figure out who performed the most.
 *
 * Slot Types:
 * 	 engagement_type : {null, note, email, task, meeting, call}
 *   salesOne        : {null, andrew, andy, john}
 *   salesTwo        : {null, andrew, andy, john}
 *   timeframe       : {today, yesterday, this week, last week, this month, last month, this year}
 *
 * Commands:
 *   I need to compare sales people.
 *   Help me compare sales people.
 *   Compare sales people.
 *   Compare {engagements}​ with {salesOne}​ and {salesTwo}​ for {timeframe}​.
 */
const config         = require(__dirname + "/config/config.json");
const hubspot_helper = require(__dirname + "/helpers/hubspot_helper");
const lambda_helper  = require(__dirname + "/helpers/lambda_helper");
const time_helper    = require(__dirname + "/helpers/time_helper");
const misc_helper    = require(__dirname + "/helpers/misc_helper");
const moment         = require("moment");

exports.handler = (event, context, callback) => {
    var slots = lambda_helper.parseSlots(event);

    /*
     * Engagements
     */
    var engagement_type = false;

    if(slots.engagements.value === null) {
        return lambda_helper.processValidation(callback, event, "engagements", "What type of engagements would you like to get? I have email, note, task, meeting, or call available.");
    }

    config.engagements.forEach((engagement) => {
        slots.engagements.value = misc_helper.format_engagement(slots.engagements.value);

        if(slots.engagements.value.includes(engagement.name) === true) {
            engagement_type = true;
        }
    });

    if(engagement_type === false) {
        return lambda_helper.processValidation(callback, event, "engagements", "I did not understand that engagement. I have email, note, task, meeting, or call available.");
    }

    engagement_type = slots.engagements.value;

    /*
     * Sales Person One
     */
    var sales_person_one_id = false;

    if(slots.salesOne.value === null) {
        return lambda_helper.processValidation(callback, event, "salesOne", "Who is the first sales person you want to compare?");
    }

    config.sales_people.forEach((person) => {
        if(slots.salesOne.value.includes(person.first) === true || slots.salesOne.value.includes(person.last) === true) {
            sales_person_one_id = parseInt(person.ownerId);
        }
    });

    if(sales_person_one_id === false) {
        return lambda_helper.processValidation(callback, event, "salesOne", "I did not find that first sales person. Who is the first sales person you want to compare?");
    }

    /*
     * Sales Person Two
     */
    var sales_person_two_id = false;

    if(slots.salesTwo.value === null) {
        return lambda_helper.processValidation(callback, event, "salesTwo", "Who is the second sales person you want to compare?");
    }

    config.sales_people.forEach((person) => {
        if(slots.salesTwo.value.includes(person.first) === true || slots.salesTwo.value.includes(person.last) === true) {
            sales_person_two_id = parseInt(person.ownerId);
        }
    });

    if(sales_person_two_id === false) {
        return lambda_helper.processValidation(callback, event, "salesTwo", "I did not find that first sales person. Who is the second sales person you want to compare?");
    }

    /*
     * Timeframe
     */
    if(slots.timeframe.value === null) {
        return lambda_helper.processValidation(callback, event, "timeframe", "What timeframe would you like to compare? Yesterday, last week, or last month?");
    }

    var timeframe = time_helper.timeframe_check(slots.timeframe.value);

    if(timeframe === false) {
        return lambda_helper.processValidation(callback, event, "timeframe", "I did not understand that timeframe. What timeframe would you like to compare? Yesterday, last week, or last month?");
    }

    // Create the request into hubspot using the helper.
    hubspot_helper.createRequest("/engagements/v1/engagements/paged?", "GET", null).then((body) => {
        var sales_person_one_num_engagements = 0;
        var sales_person_two_num_engagements = 0;

        body.forEach((data) => {
            data.results.forEach((engagement) => {
                var timestamp = moment(engagement.engagement.timestamp).startOf("date");

                // Test to see if engagement's timestamp is within requested range.
                var timeframe_in_range = false;

                if(timeframe.range === false) {
                    timeframe_in_range = timeframe.operator(timestamp, timeframe.comparable);
                } else {
                    timeframe_in_range = timeframe.operator(timestamp, timeframe.comparable_low, timeframe.comparable_high);
                }

                // Test to see if engagement meets criteria provided by slots.
                if(engagement.engagement.type === engagement_type && timeframe_in_range === true) {
                    if(engagement.engagement.ownerId === sales_person_one_id) {
                        ++sales_person_one_num_engagements;
                    } else if(engagement.engagement.ownerId === sales_person_two_id) {
                        ++sales_person_two_num_engagements;
                    }
                }
            });
        });

        var message = null;
        var diff    = 0;

        engagement_type = engagement_type.toLowerCase();

        // Check if sales person one made more engagements.
        // Check if sales person two made more engagements.
        // Otherwise they were equal.
        if(sales_person_one_num_engagements > sales_person_two_num_engagements) {
            diff = sales_person_one_num_engagements - sales_person_two_num_engagements;

            message = `${slots.salesOne.value} logged ${diff} more ${engagement_type}s than ${slots.salesTwo.value} ${slots.timeframe.value}.`;
        } else if(sales_person_one_num_engagements < sales_person_two_num_engagements) {
            diff = sales_person_two_num_engagements - sales_person_one_num_engagements;

            message = `${slots.salesTwo.value} logged ${diff} more ${engagement_type}s than ${slots.salesOne.value} ${slots.timeframe.value}.`;
        } else {
            message = `${slots.salesOne.value} and ${slots.salesTwo.value} logged the same amount of ${engagement_type}s ${slots.timeframe.value}.`;
        }

        return lambda_helper.processCallback(callback, event, "Fulfilled", message);
    });
};
