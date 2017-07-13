/**
 * Intent:
 *   CreateEngagementFor
 *
 * Description:
 *   Quickly be able to create an engagement in HubSpot.
 *
 * Slot Types:
 * 	 engagement_type : {note, email, task, meeting, call}
 *   sales_slot :      {andrew, andy, john}
 *   timeframe :       {today, yesterday, this week, last week, this month, last month, this year}
 *
 * Commands:
 *   Create an {engagement}
 *   Log an {engagement}
 */
const config         = require(__dirname + "/config/config.json");
const hubspot_helper = require(__dirname + "/helpers/hubspot_helper");
const lambda_helper  = require(__dirname + "/helpers/lambda_helper");
const misc_helper    = require(__dirname + "/helpers/misc_helper");

exports.handler = (event, context, callback) => {
    var slots                = lambda_helper.parseSlots(event);
    var sessionAttributes    = event.sessionAttributes || {};
    var message              = "";
    var selected_contact_id  = null;
    var contact_list         = [];
    var confirmation_counter = 0;

    var engagement_data = {
        "engagement": {
            "active": true,
            "ownerId": null,
            "type": null,
            "timestamp": Date.now()
        },
        "associations": {
            "contactIds": [selected_contact_id],
            "companyIds": [],
            "dealIds": [],
            "ownerIds": []
        },
        "attachments": [],
        "metadata": {}
    };

    // Required post information.
    // https://developers.hubspot.com/docs/methods/engagements/create_engagement

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
    var sales_person = false;

    if(slots.sales.value === null) {
        return lambda_helper.processValidation(callback, event, "sales", "What team member does this relate to?");
    }

    config.sales_people.forEach((person) => {
        if(slots.sales.value.includes(person.first) === true || slots.sales.value.includes(person.last) === true) {
            sales_person = parseInt(person.ownerId);
        }
    });

    if(sales_person === false) {
        return lambda_helper.processValidation(callback, event, "sales", "I did not find that team member. Who is the first sales person you want to compare?");
    }

    /*
     * Contact
     */
    var contact_slot            = slots.contacts.value;
    var contact_confirmation    = slots.contact_confirmation.value;
    if(contact_slot === null) {
        // Lex didnt recognize the slot name
        return lambda_helper.processValidation(callback, event, "contacts", "What contact does this relate to?");

    } else if(contact_confirmation === "yes") {
        // The user selected the last result
        confirmation_counter = parseInt(event.sessionAttributes.confirmation_count) - 1;
        contact_list         = JSON.parse(event.sessionAttributes.contact);
        var selected_contact     = contact_list[confirmation_counter];
        selected_contact_id  = selected_contact.contact_id;

        if (sessionAttributes.engagement_step > 0) {
            console.log(sessionAttributes.engagement_step, "greater than 0");
        } else {
            sessionAttributes.engagement_step = 0;
            event.sessionAttributes = sessionAttributes;
        }

        console.log(`${selected_contact_id} Contact has been confirmed!`);
    // User denied the last contact we showed them.
    } else if(contact_confirmation === "no") {
        contact_list         = JSON.parse(event.sessionAttributes.contact);
        confirmation_counter = parseInt(event.sessionAttributes.confirmation_count);

        // Make sure there is still more contacts to cycle through.
        if(contact_list.length - 1 < confirmation_counter) {
            return lambda_helper.processCallback(callback, event, "Fulfilled", `No more possible matches for ${contact_slot}`);
        };

        var full_name = `${contact_list[confirmation_counter].first_name} ${contact_list[confirmation_counter].last_name}`;
        var job_title = `${contact_list[confirmation_counter].job_title}`;

        // Cycle to next available contact.
        ++confirmation_counter;

        // Reset sessionAttributes to send to lex.
        sessionAttributes.confirmation_count = confirmation_counter;
        sessionAttributes.contact = JSON.stringify(contact_list);
        event.sessionAttributes = sessionAttributes;

        return lambda_helper.processValidation(callback, event, "contact_confirmation", `Is ${full_name}, ${job_title}, who you are looking for? (yes, no)`);
    // We haven't supplied the user with a contact to confirm yet.
    } else if(contact_confirmation === null) {
        // Define the properties we want back from hubspot
        // which ultimately improves the speed of the API call.
        var hubspot_properties = "&property=" + ["associatedcompanyid", "jobtitle", "firstname", "lastname"].join("&property=");

        // Search for the contacts in HubSpot
        hubspot_helper.createRequest(`/contacts/v1/search/query?q=${contact_slot}${hubspot_properties}`, "GET", null).then((body) => {
            contact_list = [];

            // Loop through each of the contacts for potentially multiple matches.
            body.forEach((data) => {
                data.contacts.forEach((result) => {
                    var contact           = {};

                    contact.contact_id    = "vid" in result ? result.vid : null;
                    contact.assoc_comp_id = "associatedcompanyid" in result.properties ? result.properties.associatedcompanyid.value : null;
                    contact.first_name    = "firstname" in result.properties ? result.properties.firstname.value : null;
                    contact.last_name     = "lastname" in result.properties ? result.properties.lastname.value : null;
                    contact.job_title     = "jobtitle" in result.properties ? result.properties.jobtitle.value : null;
                    contact.full_name     = `${contact.first_name} ${contact.last_name}`;

                    contact_list.push(contact);
                });
            });

            if(contact_list.length === 0) {
                // Hubspot Search returned 0 results.
                return lambda_helper.processCallback(callback, event, "Failed", `${contact_slot} doesn't appear to be a contact within hubspot.`);
            }

            // Contact attributes.
            var full_name = `${contact_list[0].first_name} ${contact_list[0].last_name}`;
            var job_title = `${contact_list[0].job_title}`;

            // Account for the first name being sent back.
            confirmation_counter = 1;

            // Set session attributes for lex.
            sessionAttributes.confirmation_count = confirmation_counter;
            sessionAttributes.contact = JSON.stringify(contact_list);
            event.sessionAttributes = sessionAttributes;

            return lambda_helper.processValidation(callback, event, "contact_confirmation", `Is ${full_name}, ${job_title}... who you are looking for? (yes, no)`);

        }).catch((err) => {
            return lambda_helper.processCallback(callback, event, "Failed", err.message);
        });
    }

    /*
     * Engagement Meta Data
     */

    // Start to fill out engagement object to post.
    engagement_data.engagement.ownerId = sales_person;
    engagement_data.engagement.type = engagement_type;
    engagement_data.associations.contactIds = [selected_contact_id];

    // The rest will depend upon the engagement type.
    if(contact_confirmation === "yes" && (slots.meta_confirmation.value === null || slots.meta_confirmation.value !== "yes" || slots.meta_confirmation.value !== "no")) {
        if(slots.engagements.value === "CALL") {

            // Call step 1
            if(parseInt(sessionAttributes.engagement_step) === 0) {
                sessionAttributes.engagement_step = 1;
                event.sessionAttributes = sessionAttributes;
                message = "Was your call answered or did they just ghost you? (answer, no answer)";
                return lambda_helper.processValidation(callback, event, "meta_confirmation", message);

            // Call step 2
            } else if (parseInt(sessionAttributes.engagement_step) === 1) {
                var call_status = event.inputTranscript;

                // answered or no answer
                if(call_status.toLowerCase() === "no answer") {
                    call_status = "NO_ANSWER";
                } else {
                    call_status = "COMPLETED";
                };

                //Add meta data to engagement object.
                engagement_data.metadata.status = call_status;
                sessionAttributes.engagement_data = JSON.stringify(engagement_data);
                sessionAttributes.engagement_step = 2;
                event.sessionAttributes = sessionAttributes;

                message = "Ok great, give me a brief summary of the call to log.";
                return lambda_helper.processValidation(callback, event, "meta_confirmation", message);

            // Call step 3
            } else if (parseInt(sessionAttributes.engagement_step) === 2) {
                //Add meta data to engagement object.
                engagement_data = JSON.parse(sessionAttributes.engagement_data);
                engagement_data.metadata.body = event.inputTranscript;
                sessionAttributes.engagement_data = JSON.stringify(engagement_data);
                event.sessionAttributes = sessionAttributes;

                //Make Hubspot Post
                hubspot_helper.createRequest(`/engagements/v1/engagements/`, "POST", engagement_data).then(() => {
                    message = "Ring ring ring! That call has been logged, keep up the good work!";
                    return lambda_helper.processCallback(callback, event, "Fulfilled", message);
                }).catch((err) => {
                    return lambda_helper.processCallback(callback, event, "Failed", err.message);
                });
            };
        } else if(slots.engagements.value === "EMAIL") {

            // Email step 1
            if(parseInt(sessionAttributes.engagement_step) === 0) {
                sessionAttributes.engagement_step = 1;
                event.sessionAttributes = sessionAttributes;

                message = `Give me the body of the email or in the interest of robot time just give me the gist!`;
                return lambda_helper.processValidation(callback, event, "meta_confirmation", message);

            // Email step 2
            } else if (parseInt(sessionAttributes.engagement_step) === 1) {
                engagement_data.metadata.text = event.inputTranscript;
                sessionAttributes.engagement_data = JSON.stringify(engagement_data);
                event.sessionAttributes = sessionAttributes;

                //Make Hubspot Post
                hubspot_helper.createRequest(`/engagements/v1/engagements/`, "POST", engagement_data).then(() => {
                    message = "Consider it done... your email has been logged, keep up the good work!";
                    return lambda_helper.processCallback(callback, event, "Fulfilled", message);
                }).catch((err) => {
                    return lambda_helper.processCallback(callback, event, "Failed", err.message);
                });
            };

        } else if(slots.engagements.value === "MEETING") {
            // Meeting step 1
            if(parseInt(sessionAttributes.engagement_step) === 0) {
                sessionAttributes.engagement_step = 1;
                event.sessionAttributes = sessionAttributes;

                message = `Awesome, tell me how the meeting went!`;
                return lambda_helper.processValidation(callback, event, "meta_confirmation", message);
            // Meeting step 2
            } else if (parseInt(sessionAttributes.engagement_step) === 1) {
                engagement_data.metadata.body = event.inputTranscript;
                sessionAttributes.engagement_data = JSON.stringify(engagement_data);
                event.sessionAttributes = sessionAttributes;

                //Make Hubspot Post
                hubspot_helper.createRequest(`/engagements/v1/engagements/`, "POST", engagement_data).then(() => {
                    message = "Your wish is my command... the meeting has been logged, keep up the grind!";
                    return lambda_helper.processCallback(callback, event, "Fulfilled", message);
                }).catch((err) => {
                    return lambda_helper.processCallback(callback, event, "Failed", err.message);
                });
            };

        } else if(slots.engagements.value === "TASK") {
            // Task step 1
            if(parseInt(sessionAttributes.engagement_step) === 0) {
                sessionAttributes.engagement_step = 1;
                event.sessionAttributes = sessionAttributes;

                message = `What would you like ${slots.sales.value} to do?`;
                return lambda_helper.processValidation(callback, event, "meta_confirmation", message);
            // Task step 2
            } else if (parseInt(sessionAttributes.engagement_step) === 1) {
                engagement_data.metadata.body = event.inputTranscript;
                engagement_data.metadata.status = "NOT_STARTED";
                engagement_data.metadata.forObjectType = "CONTACT";
                sessionAttributes.engagement_data = JSON.stringify(engagement_data);
                event.sessionAttributes = sessionAttributes;

                //Make Hubspot Post
                hubspot_helper.createRequest(`/engagements/v1/engagements/`, "POST", engagement_data).then(() => {
                    message = "Sounds good, I relayed the message. Do you think I could send some robot work in their direction while we are at it?";
                    return lambda_helper.processCallback(callback, event, "Fulfilled", message);
                }).catch((err) => {
                    return lambda_helper.processCallback(callback, event, "Failed", err.message);
                });
            };

        } else if(slots.engagements.value === "NOTE") {
            // Note step 1
            if(parseInt(sessionAttributes.engagement_step) === 0) {
                sessionAttributes.engagement_step = 1;
                event.sessionAttributes = sessionAttributes;

                message = `Thats an easy one! What should the note say?`;
                return lambda_helper.processValidation(callback, event, "meta_confirmation", message);
            // Note step 2
            } else if (parseInt(sessionAttributes.engagement_step) === 1) {
                engagement_data.metadata.body = event.inputTranscript;
                sessionAttributes.engagement_data = JSON.stringify(engagement_data);
                event.sessionAttributes = sessionAttributes;

                //Make Hubspot Post
                hubspot_helper.createRequest(`/engagements/v1/engagements/`, "POST", engagement_data).then(() => {
                    message = "I am a professional note taker by design. All set! (pats robot back)";
                    return lambda_helper.processCallback(callback, event, "Fulfilled", message);
                }).catch((err) => {
                    return lambda_helper.processCallback(callback, event, "Failed", err.message);
                });
            };
        };
    };
};
