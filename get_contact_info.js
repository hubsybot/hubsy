/**
 * Intent:
 *   ContactInfo
 *
 * Description:
 *   This command will get the contact information for a given contact in HubSpot.
 *
 * Slot Types:
 * 	 contact_info : {email, title, name, phone, all}
 *   contacts     : {(massive list of potential names for Lex to learn)}
 *   confirmation : {yes, no}
 *
 * Commands:
 *   Can you tell me contact info for {contact}?
 *   How can i contact {contact}?
 */
const hubspot_helper = require(__dirname + "/helpers/hubspot_helper");
const lambda_helper  = require(__dirname + "/helpers/lambda_helper");

exports.handler = (event, context, callback) => {
    var slots             = lambda_helper.parseSlots(event);
    var sessionAttributes = lambda_helper.parseSession(event);

    // Get contact information.
    var contact_info = slots.contact_info.value;
    var contact_slot = slots.contacts.value;
    var confirmation = slots.confirmation.value;

    var confirmation_counter = null;
    var contact_list = null;

    if(contact_slot === null) {
        return lambda_helper.processCallback(callback, event, "Failed", "We did not recognize the results name.");
    }

    // Define the properties we want back from hubspot
    var hubspot_properties = "&property=" + ["associatedcompanyid", "jobtitle", "firstname", "lastname"].join("&property=");

    // If we got the correct user for the client and they say yes we will get the info.
    // Otherwise if the user denied the last contact we showed them we will present
    // any others that we have.
    if(confirmation === "yes") {
        if(contact_info === null) {
            // If we do not have the contact_info value we want to request send a followup.
            return lambda_helper.processValidation(callback, event, "contact_info", "What type of information would you like to get? (summary, email, title, phone)");
        }

        // The user selected the last result
        confirmation_counter    = parseInt(sessionAttributes.confirmation_count) - 1;
        contact_list            = JSON.parse(sessionAttributes.contact);

        var selected_contact    = contact_list[confirmation_counter];
        var selected_contact_id = selected_contact.contact_id;

        // The user has confirmed the contact and the contact_id has been established
        hubspot_helper.createRequest(`/contacts/v1/contact/vid/${selected_contact_id}/profile?`, "GET", null).then((body) => {
            var person_data = body[0].properties;

            var company_data = null;
            var company_name = null;

            if(body[0]["associated-company"] !== undefined) {
                company_data = body[0]["associated-company"].properties;
                company_name = "name" in company_data ? company_data.name.value : null;
            }

            var first_name = "firstname" in person_data ? person_data.firstname.value : null;
            var last_name  = "lastname" in person_data ? person_data.lastname.value : null;
            var full_name  = `${first_name} ${last_name}`;
            var revenue    = "annualrevenue" in person_data ? person_data.annualrevenue.value : null;
            var email      = "email" in person_data ? person_data.email.value : null;
            var phone      = "phone" in person_data ? person_data.phone.value : null;
            var city       = "city" in person_data ? person_data.city.value : null;
            var state      = "state" in person_data ? person_data.state.value : null;
            var address    = "address" in person_data ? person_data.address.value : null;
            var job_title  = "jobtitle" in person_data ? person_data.jobtitle.value : null;

            if(contact_info.includes("summary")) {
                content = `Here's what I found on ${full_name}. `;

                if(company_name !== null) {
                    content = content + `This indvidual works at ${company_name}. `;
                }

                if(city !== null && state !== null) {
                    content = content + `Hailing from ${city}, ${state}. `;
                }

                if(revenue !== null) {
                    content = content + `They are worth $${revenue} to us. `;
                }

                content = content + `I'll just get to the point though. `;

                if(phone !== null) {
                    content = content + `Their phone number is ${phone}. `;
                }

                if(email !== null) {
                    content = content + `Their email is ${email}. `;
                }

                if(address !== null) {
                    content = content + `Their address is ${address}. `;
                }
            } else if(contact_info.includes("email")) {
                if(person_data.email.value === null) {
                    return lambda_helper.processValidation(callback, event, "contact_info", `Oops, email is unavailable for ${full_name} want something else? (title, phone)`);
                } else {
                    content = `Email is ${email}`;
                }
            } else if(contact_info.includes("title")) {
                if(person_data.jobtitle.value === null) {
                    return lambda_helper.processValidation(callback, event, "contact_info", `Oops, title is unavailable for ${full_name} want something else? (email, phone)`);
                } else {
                    content = `Job title is ${job_title}`;
                }
            } else if(contact_info.includes("name")) {
                if(full_name === null) {
                    return lambda_helper.processValidation(callback, event, "contact_info", `Oops, full name is unavailable for this indvidual, want something else? (email, phone, title)`);
                } else {
                    content = `Name is ${full_name}`;
                }
            } else if(contact_info.includes("phone")) {
                if(person_data.phone.value === null) {
                    return lambda_helper.processValidation(callback, event, "contact_info", `Oops, phone is unavailable for ${full_name}, want something else? (email, title)`);
                } else {
                    content = `Phone is ${phone}`;
                }
            }

            return lambda_helper.processCallback(callback, event, "Fulfilled", content);
        }).catch((err) => {
            return lambda_helper.processCallback(callback, event, "Failed", err.message);
        });
    } else if(confirmation === "no") {
        contact_list         = JSON.parse(sessionAttributes.contact);
        confirmation_counter = parseInt(sessionAttributes.confirmation_count);

        // Make sure there is still more contacts to cycle through.
        if(contact_list.length - 1 < confirmation_counter) {
            return lambda_helper.processCallback(callback, event, "Fulfilled", `No more possible matches for ${contact_slot}`);
        }

        var full_name = `${contact_list[confirmation_counter].first_name} ${contact_list[confirmation_counter].last_name}`;
        var job_title = `${contact_list[confirmation_counter].job_title}`;

        // Cycle to next available contact.
        ++confirmation_counter;

        // Reset sessionAttributes to return to lex.
        sessionAttributes.confirmation_count = confirmation_counter;
        sessionAttributes.contact = JSON.stringify(contact_list);

        event = lambda_helper.setSession(event, sessionAttributes);

        return lambda_helper.processValidation(callback, event, "confirmation", `Is ${full_name}, ${job_title}, who you are looking for?`);
    // We haven't supplied the user with a contact to confirm yet.
    } else if(confirmation === null) {
        // Search for the contacts in HubSpot
        hubspot_helper.createRequest(`/contacts/v1/search/query?q=${contact_slot}${hubspot_properties}`, "GET", null).then((body) => {
            var contact_list    = [];

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

            event = lambda_helper.setSession(event, sessionAttributes);

            return lambda_helper.processValidation(callback, event, "confirmation", `Is ${full_name}, ${job_title}... who you are looking for?`);
        }).catch((err) => {
            return lambda_helper.processCallback(callback, event, "Failed", err.message);
        });
    }
};
