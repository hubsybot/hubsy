/**
 * Intent:
 *   create_or_update_contact
 *
 * Description:
 *   Quickly be able to create a contact within hubspot.
 *
 * Slot Types:
 * 	 contact_email : Email address that we are going to be updating or creating
 *   first_name : Contacts first name
 *   last_name : Contacts last name
 *   company : Company contact works for
 *   phone : Contact's phone number
 *   city : City contact lives or works in
 *   state : State contact lives or works in
 *
 * Commands:
 *   Create contact
 *   Update contact
 *   Create contact for {contact_email}
 */

const hubspot_helper = require(__dirname + "/helpers/hubspot_helper");
const lambda_helper  = require(__dirname + "/helpers/lambda_helper");
const misc_helper    = require(__dirname + "/helpers/misc_helper");

exports.handler = (event, context, callback) => {
    var slots                = lambda_helper.parseSlots(event);
    var sessionAttributes    = lambda_helper.parseSession(event);
    var message              = "";

    // Required post information.
    // https://developers.hubspot.com/docs/methods/contacts/create_or_update

    /*
     * Email Verification
     */
    var contact_email = slots.contact_email.value;
    // Lets me know if I have already prompted the user for contact email
    var contact_prompt = "contact_prompt" in sessionAttributes ? event.sessionAttributes.contact_prompt : false;
    var email_valid    = false;

    if(contact_email === null) {
        if (contact_prompt === true) {
            // Grab email from transcript.
            contact_email = event.inputTranscript;

            // Validate email.
            email_valid = misc_helper.validateEmail(contact_email);
            if (email_valid === false) {
                message = "Please provide me with a valid email address.";
                return lambda_helper.processValidation(callback, event, "contact_email", message);
            } else {
                // Manually set the slot.
                lambda_helper.setSlot(event, "contact_email", contact_email);
            };
        } else {
            // Initially prompt th user for the email address of the contact.
            sessionAttributes.contact_email_prompt = true;
            event = lambda_helper.setSession(event, sessionAttributes);

            message = "Hit me with the email address of the contact you want to create or update.";
            return lambda_helper.processValidation(callback, event, "contact_email", message);
        }
    // If lex recognizes the email off the bat, just validate it to make sure.
    } else {
        // Lex sends emails back like mailto: {email} | {email}.
        contact_email = contact_email.includes("|") ? contact_email.split("|")[1] : contact_email;

        email_valid = misc_helper.validateEmail(contact_email);
        if (email_valid === false) {
            message = "Please provide me with a valid email address.";
            return lambda_helper.processValidation(callback, event, "contact_email", message);
        } else {
            // Update slot with split value.
            console.log('setting email bruh');
            lambda_helper.setSlot(event, "contact_email", contact_email);
        }
    }

    /*
     * Contact meta data.
     */
    var first_name = slots.first_name.value;
    var last_name = slots.last_name.value;
    var company = slots.company.value;
    var phone = slots.phone.value;
    var city = slots.city.value;
    var state = slots.state.value;

    // Relying on the fact that these will be sent in order.
    if(first_name === null) {
        message = "What is the contacts first name?";
        return lambda_helper.processValidation(callback, event, "first_name", message);
    };

    if(last_name === null) {
        message = "What is the contacts last name?";
        return lambda_helper.processValidation(callback, event, "last_name", message);
    };

    if(phone === null) {
        message = "What is this contacts phone number (only numbers)?";
        return lambda_helper.processValidation(callback, event, "phone", message);
    };

    if(company === null) {
        message = "Who does the contact work for?";
        return lambda_helper.processValidation(callback, event, "company", message);
    };

    if(state === null) {
        message = "What state does this contact live in?";
        return lambda_helper.processValidation(callback, event, "state", message);
    } else {
        if(state.length > 2) {
            message = "Hubspot prefers state's abbreviation (eg. NY)";
            return lambda_helper.processValidation(callback, event, "state", message);
        };
    };

    if(city === null) {
        message = "What city does the contact live/work in?";
        return lambda_helper.processValidation(callback, event, "city", message);
    }

    /*
     * Confirmation and Post
     */
    var contact_confirmation = slots.contact_confirmation.value;
    var contact_data = {
        "properties": [
            {
                "property": "email",
                "value": contact_email,
            },
            {
                "property": "firstname",
                "value": first_name,
            },
            {
                "property": "lastname",
                "value": last_name,
            },
            {
                "property": "company",
                "value": company,
            },
            {
                "property": "phone",
                "value": phone,
            },
            {
                "property": "city",
                "value": city,
            },
            {
                "property": "state",
                "value": state,
            },
        ]
    };

    if(contact_confirmation === null) {
        message = `Does this look good to you? ${first_name} ${last_name} ${company} ${contact_email} ${phone} ${city}, ${state}`;

        return lambda_helper.processValidation(callback, event, "contact_confirmation", message);

    } else if(contact_confirmation === "no") {
        message = "Hubsy understands he has failed you. Hubsy leave now.";
        return lambda_helper.processCallback(callback, event, "Failed", message);

    } else if(contact_confirmation === "yes") {
        console.log("contact_data", contact_data);
        // Make Hubspot Post
        hubspot_helper.createRequest(`/contacts/v1/contact/createOrUpdate/email/${contact_email}/`, "POST", contact_data).then(() => {
            message = "Boom, this contact has been created!";
            return lambda_helper.processCallback(callback, event, "Fulfilled", message);
        }).catch((err) => {
            return lambda_helper.processCallback(callback, event, "Failed", err.message);
        });
    };
};
