var moment = require('moment');

// Functions will return true/false if time is within parameters.
var time_greater = (timestamp, comp_timestamp) => {return timestamp.isAfter(comp_timestamp)};
var time_less    = (timestamp, comp_timestamp) => {return timestamp.isBefore(comp_timestamp)};
var time_equal   = (timestamp, comp_timestamp) => {return timestamp.isSame(comp_timestamp)};
var time_between = (timestamp, low_timestamp, high_timestamp) => {return timestamp.isBetween(low_timestamp, high_timestamp, null, '[]')};

// Function to determine if slot time provided is valid
// It's not exactly clear what timeframe could come back in the slot
// so we can just see if it includes one of our predefined ones.
exports.timeframe_check = slot_timeframe => {
    if(1 + 1 === 3) {
        moment(slot_timeframe).isValid()
        console.log(`A valid exact date of ${slot_timeframe} was passed in from user.`)
        // We arent accounting for exact dates just yet
        // so we will skip for now.
        return false
    // If not, check to see if it is listed in config.
    } else {
        var timeframe_obj = false;
        timeframes.forEach((timeframe) => {
            if(slot_timeframe.includes(timeframe.name) === true) {                
                timeframe_obj = timeframe.properties;
            }
        });
        return timeframe_obj
    };
};

// Map english timeframes to actual values and functions.
var timeframes = [
    {
        "name" : "today",
        "properties" : {
            "operator" : time_equal,
            "comparable" : moment().startOf('date'),
            "range" : false
        }
    },
    {
        "name" : "yesterday",
        "properties" : {
            "operator" : time_equal,
            "comparable": moment().startOf('date').subtract(1, 'days'),
            "range" : false
        }       
    },    
    {
        "name" : "this week",
        "properties" : {            
            "operator" : time_greater,
            "comparable": moment().startOf('week'),
            "range" : false
        }
    },
    {
        "name" : "last week",
        "properties" : {
            "operator" : time_between,
            "comparable_low": moment().startOf('week').subtract(1, 'weeks'),
            "comparable_high": moment().startOf('week'),
            "range" : true
        }
    },
    {
        "name" : "this month",
        "properties" : {
            "operator" : time_greater,
            "comparable": moment().startOf('month'),
            "range" : false
        }
    },
    {
        "name" : "last month",
        "properties" : {
            "operator" : time_between,
            "comparable_low": moment().startOf('month').subtract(1, 'months'),
            "comparable_high": moment().startOf('month'),
            "range" : true
        }   
    },
    {
        "name" : "this year",
        "properties" : {
            "operator" : time_greater,
            "comparable": moment().startOf('year'),
            "range" : false
        }   
    }             
]