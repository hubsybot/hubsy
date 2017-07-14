/**
 * Intent:
 *   EngagementsByPeople
 *
 * Description:
 *   Engagements are used to store data from CRM actions, including notes, tasks,
 *   meetings, and calls specfied under engagement type.
 *
 * Slot Types:
 * 	 engagement_type : {note, email, task, meeting, call}
 *   sales           : {andrew, andy, john}
 *   timeframe       : {today, yesterday, this week, last week, this month, last month, this year}
 *
 * Commands:
 *   How many {engagements} have been made?
 *   How many {engagements} were made {timeframe}?
 *   How many {enagagments} did {sales} make {timeframe}?
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
     * Sales Person
     */
    var sales_person_id = false;
    var sales_name      = null;
    var owner_id        = null;

    if(slots.sales.value === null) {
        return lambda_helper.processValidation(callback, event, "sales", "Who is the sales person you want to lookup?");
    }

    config.sales_people.forEach((person) => {
        if(slots.sales.value.includes(person.first) === true || slots.sales.value.includes(person.last) === true) {
            sales_person_id = parseInt(person.ownerId);
            sales_name      = slots.sales.value;
            owner_id        = parseInt(person.ownerId);
        }
    });

    if(sales_person_id === false) {
        return lambda_helper.processValidation(callback, event, "sales", "I did not find that sales person. Who is the sales person you want to lookup?");
    }

    /*
     * Timeframe
     */
    if(slots.timeframe.value === null) {
        return lambda_helper.processValidation(callback, event, "timeframe", "What timeframe would you like to look for? Yesterday, this week, last week, last month, today?");
    }

    var timeframe = time_helper.timeframe_check(slots.timeframe.value);

    if(timeframe === false) {
        return lambda_helper.processValidation(callback, event, "timeframe", "I did not understand that timeframe. What timeframe would you like to look for? Yesterday, this week, last week, last month, today?");
    }

    hubspot_helper.createRequest("/engagements/v1/engagements/paged?", "GET", null).then((body) => {
        var num_engagements = 0;

        body.forEach((data) => {
            data.results.forEach((engagement) => {
                var timestamp = moment(engagement.engagement.timestamp).startOf("date");


                var timeframe_in_range = false;

                // Test to see if engagement's timestamp is within requested range.
                // Or in the case where there is a range of timeframes (ie. last week)
                if(timeframe.range === false) {
                    timeframe_in_range = timeframe.operator(timestamp, timeframe.comparable);
                } else {
                    timeframe_in_range = timeframe.operator(timestamp, timeframe.comparable_low, timeframe.comparable_high);
                }

                // Test to see if engagement meets criteria provided by slots.
                if(engagement.engagement.type === engagement_type && timeframe_in_range === true && sales_name === null) {
                    ++num_engagements;
                } else if(engagement.engagement.type === engagement_type && timeframe_in_range === true && sales_name !== null && engagement.engagement.ownerId === owner_id) {
                    ++num_engagements;
                }
            });
        });

        var message = "";

        if(sales_name !== null) {
            message = `Looks like ${num_engagements} ${engagement_type.toLowerCase()}(s) were logged ${slots.timeframe.value} by ${sales_name}.`;
        } else {
            message = `Looks like ${num_engagements} ${engagement_type.toLowerCase()}(s) were logged ${slots.timeframe.value}.`;
        }

        return lambda_helper.processCallback(callback, event, "Fulfilled", message);
    }).catch((err) => {
        return lambda_helper.processCallback(callback, event, "Failed", err.message);
    });
};
