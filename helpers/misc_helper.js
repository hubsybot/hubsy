// Prep engagement slot for comparison with HubSpot API output.
exports.format_engagement = (engagement_raw) => {
    // If engagement slot provided is plural, make singular.
    if(engagement_raw[engagement_raw.length -1] === "s") {
        engagement_raw = engagement_raw.slice(0, -1);
    }

    // Capitalize to match output from Hubspot API.
    return engagement_raw.toUpperCase();
};

// Returns true or false for email validation.
exports.validateEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}