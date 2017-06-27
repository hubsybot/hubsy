/**
 * Intent: EngagementsByPeople
 *
 * Commands (Variations of commands are available. See Lex intent for details.)
 *
 * Slot Types:
 * 	engagement_type : {NOTE, EMAIL, TASK, MEETING, or CALL}
 *  sales_name :      {null, andrew, andy, john}
 *  timeframe :       {today, yesterday, this week, last week, this month, last month, this year} | Defaults to today
 * 
 * How many {engagements} have been made?
 * How many {engagements} were made {timeframe}?
 * How many {enagagments} did {sales} make {timeframe}?
 */

 /** NOTES ON ENGAGEMENTS
 * Engagements are used to store data from CRM actions, including notes, 
 * tasks, meetings, and calls specfied under engagement.type
*/

const config         = require(__dirname + "/config/config.json");
const hubspot_helper = require(__dirname + "/helpers/hubspot_helper");
const lambda_helper  = require(__dirname + "/helpers/lambda_helper");
const time_helper    = require(__dirname + "/helpers/time_helper");
var moment           = require('moment');
var message          = "";

// Test event, this will come from lex.
// var event = {
//     "currentIntent": {
//         "slots": {
//             "sales": null,
//             "engagements": "calls",
//             "timeframe": "this week"
//         }
//     }
// }

// Handler for the Lambda function.
exports.handler = (event, context, callback) => {
    var slots = lambda_helper.parseSlots(event);
    console.log("engagements", slots.engagements.value)
    console.log("sales", slots.sales.value)
    console.log("timeframe", slots.timeframe.value)
    console.log("date", slots.date.value)

    // Engagement information.
    var engagement_raw       = slots.engagements.value;
    var engagement_valid     = false;
    var possible_engagements = [
        {
            "name" : "EMAIL"
        },
        {
            "name" : "NOTE"
        },
        {
            "name" : "TASK"
        },
        {
            "name" : "MEETING"
        },
        {
            "name" : "CALL"
        }
    ];

    // Prep engagement slot for comparison with Hubspot API output.
    var format_engagement = engagement_raw => {
        // If engagement slot provided is plural, make singular.
        if(engagement_raw[engagement_raw.length -1] === 's') {
            engagement_raw = engagement_raw.slice(0, -1); 
        }
        // Capitalize to match output from Hubspot API.
        return engagement_raw.toUpperCase();
    }

    // It's not exactly clear what engagement name could come back in the slot
    // so we can just see if it includes one of our predefined ones.
    var engagement_type = format_engagement(engagement_raw)
    possible_engagements.forEach((engagement) => {
        if(engagement_type.includes(engagement.name) === true) {
            engagement_type = engagement.name;
            engagement_valid = true;
        } 
    });

    if(engagement_valid === false) {
        message = `
        ${engagement_type} sounds like a strange engagement...
            Please choose one of the following:
            calls
            emails
            notes
            tasks
        `;
        console.log(message);
        return lambda_helper.processCallback(callback, event, "Failed", message);
    }

    // Sales information.
    var sales_email = null;
    var sales_name  = null;
    var owner_id    = null;

    // If there is a sales slot configured check to see who it is if is none of the
    // ones provided it was invalid and we can null the rest out.
    if(slots.sales.value !== null) {
        sales_name = slots.sales.value;

        // Loop through sales people and check for both first and last name.
        config.sales_people.forEach((person) => {
            if(sales_name.includes(person.first) === true || sales_name.includes(person.last) === true) {
                sales_email = person.email;
                owner_id = parseInt(person.ownerId);
            }
        });

        // If the name got through and it is not found then just process a failed callback.
        if(owner_id === null) {
            message = `I am sorry but we could not find the sales person ${sales_name}`;
            console.log(message);
            return lambda_helper.processCallback(callback, event, "Failed", message);
        }
    }

    // Timeframe information.
    var slot_timeframe = null;
    var timeframe_obj = null;

    // Make sure we can understand the provided relative timeframe.
    if(slots.timeframe.value !== null) {
        slot_timeframe = slots.timeframe.value;
        // Pass through time helper to get more information about slot time.
        var timeframe_obj = time_helper.timeframe_check(slot_timeframe); 
        if(timeframe_obj === false) {
            message = `
            ${slot_timeframe} sounds like it may be in the twilight zone...
                Please say something like:
                today
                yesterday
                last week
                this month
            `;        
            console.log(message);
            return lambda_helper.processCallback(callback, event, "Failed", message);
        }
    // Check to see if an exact date was provided.
    } else if(slots.date.value !== null) {
        slot_timeframe = slots.date.value;
        // Pass through time helper to get more information about slot time.
        var timeframe_obj = time_helper.timeframe_check(slot_timeframe); 
        if(timeframe_obj === false) {
            message = `
            ${slot_timeframe} sounds like it may be in the twilight zone...
                Please say something like:
                today
                yesterday
                last week
                this month
            `;        
            console.log(message);
            return lambda_helper.processCallback(callback, event, "Failed", message);
        }
    } else {
        slot_timeframe = "today";
        // Pass through time helper to get more information about slot time.
        var timeframe_obj = time_helper.timeframe_check(slot_timeframe);
    };

    // Create the request into hubspot using the helper.
    hubspot_helper.createRequest("/engagements/v1/engagements/paged?", "GET", null).then((data) => {
        var num_engagements = 0;
        var content   = "";

        // Loop through each of the engagements and if one matches the provided criteria then increase the counter.
        // Engagement info -> https://developers.hubspot.com/docs/methods/engagements/engagements-overview
        data.results.forEach((engagement) => {
            var timestamp = moment(engagement.engagement.timestamp).startOf('date');
            // Test to see if engagement's timestamp is within requested range.
            var timeframe_in_range = false;
            
            if(timeframe_obj.range === false) {
                timeframe_in_range = timeframe_obj.operator(timestamp, timeframe_obj.comparable);
            // In case there is a range of timeframes (ie. last week)
            } else {
                timeframe_in_range = timeframe_obj.operator(timestamp, timeframe_obj.comparable_low, timeframe_obj.comparable_high);
            }

            // Test cases
            console.log("engagement type", engagement.engagement.type === engagement_type,
                "timeframe in range", timeframe_in_range, "ownerId", engagement.engagement.ownerId === owner_id)

            // Test to see if engagement meets criteria provided by slots.
            if(engagement.engagement.type === engagement_type && timeframe_in_range === true && sales_name === null) {
                ++num_engagements;
            } else if(engagement.engagement.type === engagement_type && timeframe_in_range === true && sales_name !== null 
                && engagement.engagement.ownerId === owner_id) {
                    ++num_engagements;
            }
        });

        // Build the content to send back to Lex.
        if(sales_name !== null) {
            content = `Looks like ${num_engagements} ${engagement_type.toLowerCase()}(s) were logged ${slot_timeframe} by ${sales_name}.`;
        } else {
            content = `Looks like ${num_engagements} ${engagement_type.toLowerCase()}(s) were logged ${slot_timeframe}.`;
        }

        console.log(content);
        return lambda_helper.processCallback(callback, event, "Fulfilled", content);
    }).catch((err) => {
    	console.log(err);
        return lambda_helper.processCallback(callback, event, "Failed", err.message);
    });
};