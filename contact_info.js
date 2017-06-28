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
var message          = "";

// Test event, this will come from lex.
// var event = {
//     "currentIntent": {
//         "slots": {
//             "contacts": "jo"
//         }
//     }
// }

// Handler for the Lambda function.
exports.handler = (event, context, callback) => {
    var slots = lambda_helper.parseSlots(event);
    var contact_slot = slots.contacts.value;
    console.log("slots", slots)
    console.log(contact_slot)

    if (contact_slot === null) {
        return lambda_helper.processCallback(callback, event, "Failed", 'Lex sent null slot value :(');
    }



    // Contact information.

    // If there is a sales slot configured check to see who it is if is none of the
    // ones provided it was invalid and we can null the rest out.
    // if(contact !== null) {
    //     sales_name = slots.sales.value;

    //     // Loop through sales people and check for both first and last name.
    //     config.sales_people.forEach((person) => {
    //         if(sales_name.includes(person.first) === true || sales_name.includes(person.last) === true) {
    //             sales_email = person.email;
    //             owner_id = parseInt(person.ownerId);
    //         }
    //     });

    //     // If the name got through and it is not found then just process a failed callback.
    //     if(owner_id === null) {
    //         message = `I am sorry but we could not find the sales person ${sales_name}`;
    //         console.log(message);
    //         return lambda_helper.processCallback(callback, event, "Failed", message);
    //     }
    // } else {
    //     // Contact is required
    //     message = `
    //     ${engagement_type} sounds like a strange engagement...
    //         Please choose one of the following:
    //         calls
    //         emails
    //         notes
    //         tasks
    //     `;
    //     console.log(message);
    //     // return lambda_helper.processCallback(callback, event, "Failed", message);        
    // }


    // Create the request into hubspot using the helper.
    hubspot_helper.createRequest(`/contacts/v1/search/query?q=${contact_slot}`, "GET", null).then((body) => {
        var content   = "";
        var contact_list = [];
        // Loop through each of the engagements and if one matches the provided criteria then increase the counter.
        // Engagement info -> https://developers.hubspot.com/docs/methods/engagements/engagements-overview
        body.forEach((data) => {
            data.contacts.forEach((contact) => {
                // Saving Contact for later in case user is looking for someone else.
                contact_list.push(contact);
            });
        });


        console.log("contact_list", contact_list[0].properties.firstname)
        var counter = 0
        contact = contact_list[counter].properties
        // Contact Information.
        // Ternary operators because certain properties may not exist unless defined in hubspot.
        var first_name = 'firstname' in contact ? contact.firstname.value : null;
        var last_name  = 'lastname' in contact ? contact.lastname.value : null;
        var companyId  = 'associatedcompanyid' in contact ? contact.associatedcompanyid.value : null;
        var job_title  = 'job_title' in contact ? contact.job_title.value : null;
        var email      = 'email' in contact ? contact.email.value : null;
        var phone      = 'phone' in contact ? contact.phone.value : null;
        var full_name  = `${first_name} ${last_name}`;

        var contact_match = true
        // Build the content to send back to Lex.
        if(contact_match === true) {
            content = `
                I found ${full_name} based on '${contact_slot}'!
                ${job_title} at companyId: ${companyId}
                Phone: ${phone}
                Email: ${email}

                Is this who you are looking for?
            `;
        } else {
            content = `Unfortunately ${contact_slot} has not been found!`;
        }

        console.log(content);
        return lambda_helper.processCallback(callback, event, "Fulfilled", content);
    }).catch((err) => {
    	console.log(err);
        return lambda_helper.processCallback(callback, event, "Failed", err.message);
    });
};