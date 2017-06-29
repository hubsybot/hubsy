/**
 * Intent:
 *   EngagementsByPeople
 *
 * Slot Types:
 * 	engagement_type : {NOTE, EMAIL, TASK, MEETING, or CALL}
 *  sales_name :      {null, andrew, andy, john}
 *  timeframe :       {today, yesterday, this week, last week, this month, last month, this year} | Defaults to today
 *
 * Commands:
 *   How many {engagements} have been made?
 *   How many {engagements} were made {timeframe}?
 *   How many {enagagments} did {sales} make {timeframe}?
 *
 * Notes:
 */

const hubspot_helper = require(__dirname + "/helpers/hubspot_helper");
const lambda_helper  = require(__dirname + "/helpers/lambda_helper");

exports.handler = (event, context, callback) => {
    var slots        = lambda_helper.parseSlots(event);

    var contact_info = slots.contact_info.value;
    var contact_slot = slots.contacts.value;

    // If we do not have the contact information we want to request send a followup.
    if(event.invocationSource === "DialogCodeHook" && contact_info === null) {
        if(contact_slot === null) {
            return lambda_helper.processCallback(callback, event, "Failed", "We did not recognize the persons name.");
        }

        return lambda_helper.processValidation(callback, event, "contact_info", "What type of contact information would you like to get? (name, email, title, phone)");
    }

    // Create the request into hubspot using the helper.
    hubspot_helper.createRequest(`/contacts/v1/search/query?q=${contact_slot}`, "GET", null).then((body) => {
        var content      = "";
        var contact_list = [];

        // Loop through each of the engagements for potentially multiple matches.
        // Engagement info -> https://developers.hubspot.com/docs/methods/engagements/engagements-overview
        body.forEach((data) => {
            data.contacts.forEach((contact) => {
                contact_list.push(contact);
            });
        });

        // @TODO If there are multiple matches then send back to Lex for clarification.
        contact = contact_list[0].properties

        var first_name = "firstname" in contact ? contact.firstname.value : null;
        var last_name  = "lastname" in contact ? contact.lastname.value : null;
        var job_title  = "job_title" in contact ? contact.job_title.value : null;
        var email      = "email" in contact ? contact.email.value : null;
        var phone      = "phone" in contact ? contact.phone.value : null;
        var full_name  = `${first_name} ${last_name}`;

        if(contact_info.includes("all")) {
            content = `All the information.`;
        } else if(contact_info.includes("email")) {
            content = `Email is ${email}`;
        } else if(contact_info.includes("title")) {
            content = `Job title is ${job_title}`;
        } else if(contact_info.includes("name")) {
            content = `Name is ${full_name}`;
        } else if(contact_info.includes("phone")) {
            content = `Phone is ${phone}`;
        }

        return lambda_helper.processCallback(callback, event, "Fulfilled", content);
    }).catch((err) => {
        return lambda_helper.processCallback(callback, event, "Failed", err.message);
    });
};
