const moment = require('moment');

// Functions will return true/false if time is within parameters.
const time_greater = (timestamp, comp_timestamp) => {return timestamp.isAfter(comp_timestamp)};
const time_less    = (timestamp, comp_timestamp) => {return timestamp.isBefore(comp_timestamp)};
const time_equal   = (timestamp, comp_timestamp) => {return timestamp.isSame(comp_timestamp)};
const time_between = (timestamp, low_timestamp, high_timestamp) => {return timestamp.isBetween(low_timestamp, high_timestamp, null, "[]")};

// Function to determine if slot time provided is valid
// It's not exactly clear what timeframe could come back in the slot
// so we can just see if it includes one of our predefined ones.
exports.timeframe_check = slot_timeframe => {
    var timeframe_obj = false;

    console.log(`Timeframe passed in is: ${slot_timeframe}`);

    // If the slot_timeframe is not valid, check to see if it is listed in config.
    if(moment(slot_timeframe, "YYYY-MM-DD", true).isValid() === true) {
        timeframe_obj = {
            "operator" : time_equal,
            "comparable" : moment(slot_timeframe).startOf("date"),
            "range" : false
        }

        // We arent accounting for exact dates just yet so we will skip for now.
        return timeframe_obj;
    } else {
        timeframes.forEach((timeframe) => {
            if(slot_timeframe.includes(timeframe.name) === true) {
                timeframe_obj = timeframe.properties;
            }
        });

        return timeframe_obj;
    };
};

// Map english timeframes to actual values and functions.
var timeframes = [
    {
        "name" : "today",
        "properties" : {
            "operator" : time_equal,
            "comparable" : moment().startOf("date"),
            "range" : false
        }
    },
    {
        "name" : "yesterday",
        "properties" : {
            "operator" : time_equal,
            "comparable" : moment().startOf("date").subtract(1, "days"),
            "range" : false
        }
    },
    {
        "name" : "this week",
        "properties" : {
            "operator" : time_greater,
            "comparable" : moment().startOf("week"),
            "range" : false
        }
    },
    {
        "name" : "last week",
        "properties" : {
            "operator" : time_between,
            "comparable_low" : moment().startOf("week").subtract(1, "weeks"),
            "comparable_high" : moment().startOf("week"),
            "range" : true
        }
    },
    {
        "name" : "this month",
        "properties" : {
            "operator" : time_greater,
            "comparable" : moment().startOf("month"),
            "range" : false
        }
    },
    {
        "name" : "last month",
        "properties" : {
            "operator" : time_between,
            "comparable_low" : moment().startOf("month").subtract(1, "months"),
            "comparable_high" : moment().startOf("month"),
            "range" : true
        }
    },
    {
        "name" : "this year",
        "properties" : {
            "operator" : time_greater,
            "comparable" : moment().startOf("year"),
            "range" : false
        }
    }
];
