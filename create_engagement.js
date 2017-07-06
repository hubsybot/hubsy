/**
 * Intent:
 *   CreateEngagementFor
 *
 * Slot Types:
 * 	engagement_type : {NOTE, EMAIL, TASK, MEETING, or CALL}
 *  sales_slot :      {null, andrew, andy, john}
 *  timeframe :       {today, yesterday, this week, last week, this month, last month, this year} | Defaults to today
 *
 * Commands:
 *   How many {engagements} have been made?
 *   How many {engagements} were made {timeframe}?
 *   How many {enagagments} did {sales} make {timeframe}?
 *
 * Notes:
 */

const config         = require(__dirname + "/config/config.json");
const hubspot_helper = require(__dirname + "/helpers/hubspot_helper");
const lambda_helper  = require(__dirname + "/helpers/lambda_helper");

// var event = {
//     'confirmation' : 'yes',
//     'contact_info' : 'summary',
//     'sessionAttributes' : {
//         'confirmation_count' : 1,
//     'contact' : [
//          { 'contact_id': 301,
//            'assoc_comp_id': '484024107',
//            'first_name': 'Joe',
//            'last_name': 'Blow',
//            'job_title': 'That Guy',
//            'full_name': 'Joe Blow' },
//          { 'contact_id': 101,
//            'assoc_comp_id': '488824200',
//            'first_name': 'John',
//            'last_name': 'Doe',
//            'job_title': 'Anonymous Creator',
//            'full_name': 'John Doe' } ]
//     } 
// }

exports.handler = (event, context, callback) => {
    console.log(event);
    console.log("beginning check", event.sessionAttributes)
    var slots        = lambda_helper.parseSlots(event);
    var sessionAttributes = event.sessionAttributes || {};

    // For testing
    // var contact_slot    = null;
    // var engagement_slot = 'note';
    // var sales_slot      = 'Andrew';
    // var engagement_valid = false;
    // var contact_confirmation    = null;

    // Get Engagement Creation from slots.
    var contact_slot    = slots.contacts.value;
    var engagement_slot = slots.engagements.value;
    var sales_slot      = slots.sales.value;
    
    // Validations
    var engagement_valid = "engagement_valid" in sessionAttributes ? sessionAttributes.engagement_valid : false;
    var contact_confirmation    = slots.contact_confirmation.value;

    // Required post information.
    // https://developers.hubspot.com/docs/methods/engagements/create_engagement
    var engagement_type = null;
    var owner_id = null;
    var timestamp = Date.now();

    // Engagement validation.
    if(engagement_slot === null) {
        return lambda_helper.processValidation(callback, event, "engagements", 'Lex didnt reconize the engagement mentioned.');
    } else {
        // Test to see if engagement provided is valid
        if(engagement_valid === false) {
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
        
            possible_engagements.forEach((engagement) => {
                console.log(engagement_slot.toUpperCase().includes(engagement.name))
                if(engagement_slot.toUpperCase().includes(engagement.name) === true) {
                    engagement_type = engagement.name;
                    engagement_valid = true;
                }
            });

            if(engagement_valid === false) {
                var message = `
                ${engagement_type} sounds like a strange engagement...
                    Please choose one of the following:
                    calls
                    emails
                    notes
                    tasks
                `;
                return lambda_helper.processValidation(callback, event, "engagements", message);
            // Engagement type was just found to be valid
            } else {
                // Update Session Attributes
                sessionAttributes.engagement_valid = true      
                event.sessionAttributes = sessionAttributes
            };
        } else {
            console.log("Engagement has already been validated")
        };    
    };

    // Sales validation which ultimately stems from config file.
    if(sales_slot === null) {
        // Lex didnt recognize the slot name
        return lambda_helper.processValidation(callback, event, "sales", "What member of your team should this be assigned to?");
    } else {
        // Loop through sales people and check for both first and last name.
        config.sales_people.forEach((person) => {
            if(sales_slot.includes(person.first) === true || sales_slot.includes(person.last) === true) {
                owner_id = parseInt(person.ownerId);
            }
        });
        // If the name got through and it is not found then just process a failed callback.
        if(owner_id === null) {
            message = `I am sorry but we could not find the sales person ${sales_slot}`;

            return lambda_helper.processCallback(callback, event, "Failed", message);
        };
    };

    // Contact validation
    if(contact_slot === null) {
        // Lex didnt recognize the slot name
        return lambda_helper.processValidation(callback, event, "contacts", "What contact does this relate to?");

    } else if(contact_confirmation === "yes") {
        // The user selected the last result
        var confirmation_counter = parseInt(event.sessionAttributes.confirmation_count) - 1;
        var contact_list         = JSON.parse(event.sessionAttributes.contact)
        var selected_contact     = contact_list[confirmation_counter]
        var selected_contact_id  = selected_contact.contact_id    
        console.log(`${selected_contact_id} Contact has been confirmed!`)
        return lambda_helper.processCallback(callback, event, "Fulfilled", `Ok great, thats all the information I care about right now.`)

    // User denied the last contact we showed them.     
    } else if(contact_confirmation === "no") {
        var contact_list         = JSON.parse(event.sessionAttributes.contact)     
        var confirmation_counter = parseInt(event.sessionAttributes.confirmation_count);
        
        // Make sure there is still more contacts to cycle through.
        if(contact_list.length - 1 < confirmation_counter) {
            console.log(`No more possible matches for ${contact_slot}`)
            return lambda_helper.processCallback(callback, event, "Fulfilled", `No more possible matches for ${contact_slot}`)
        };

        console.log("contact_list", contact_list)
        var full_name = `${contact_list[confirmation_counter].first_name} ${contact_list[confirmation_counter].last_name}`
        var job_title = `${contact_list[confirmation_counter].job_title}`        

        // Cycle to next available contact.
        ++confirmation_counter
        
        // Reset sessionAttributes to send to lex.
        sessionAttributes.confirmation_count = confirmation_counter
        sessionAttributes.contact = JSON.stringify(contact_list)
        event.sessionAttributes = sessionAttributes

        console.log(`Is ${full_name}, ${job_title}, who you are looking for? (yes, no)`)
        return lambda_helper.processValidation(callback, event, "contact_confirmation", `Is ${full_name}, ${job_title}, who you are looking for? (yes, no)`)

    // We haven't supplied the user with a contact to confirm yet.
    } else if(contact_confirmation === null) {
        // Define the properties we want back from hubspot
        // which ultimately improves the speed of the API call.
        var hubspot_properties = [
           'associatedcompanyid',
           'jobtitle',
           'firstname',
           'lastname'
        ]
        hubspot_properties = '&property=' + hubspot_properties.join('&property=')

        // Create the request into hubspot using the helper.
        // Contacts search -> https://developers.hubspot.com/docs/methods/contacts/search_contacts
        hubspot_helper.createRequest(`/contacts/v1/search/query?q=${contact_slot}${hubspot_properties}`, "GET", null).then((body) => {
            var content         = "";
            var contact_list    = [];

            // Loop through each of the contacts for potentially multiple matches.
            body.forEach((data) => {
                data.contacts.forEach((result) => {
                    var contact           = {}
                    contact.contact_id    = "vid" in result ? result.vid : null;
                    contact.assoc_comp_id = "associatedcompanyid" in result.properties ? result.properties.associatedcompanyid.value : null
                    contact.first_name    = "firstname" in result.properties ? result.properties.firstname.value : null;
                    contact.last_name     = "lastname" in result.properties ? result.properties.lastname.value : null;
                    contact.job_title     = "jobtitle" in result.properties ? result.properties.jobtitle.value : null;
                    contact.full_name     = `${contact.first_name} ${contact.last_name}`;
                    contact_list.push(contact);
                });
            });

            console.log(contact_list)

            if(contact_list.length === 0) {
                // Hubspot Search returned 0 results.
                return lambda_helper.processCallback(callback, event, "Failed", `${contact_slot} doesn't appear to be a contact within hubspot.`);
            }

            // Contact attributes. 
            var full_name = `${contact_list[0].first_name} ${contact_list[0].last_name}`
            var job_title = `${contact_list[0].job_title}`

            // Account for the first name being sent back.
            confirmation_counter = 1

            // Set session attributes for lex.
            sessionAttributes.confirmation_count = confirmation_counter
            sessionAttributes.contact = JSON.stringify(contact_list)
            event.sessionAttributes = sessionAttributes

            console.log("ending check", event.sessionAttributes)
            console.log("confirmation_count", confirmation_counter)
            return lambda_helper.processValidation(callback, event, "contact_confirmation", `Is ${full_name}, ${job_title}... who you are looking for? (yes, no)`)

        }).catch((err) => {
            console.log(err.message)
            return lambda_helper.processCallback(callback, event, "Failed", err.message);
        });
    }
};
