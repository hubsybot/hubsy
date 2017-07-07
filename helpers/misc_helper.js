// Prep engagement slot for comparison with Hubspot API output.
exports.format_engagement = (engagement_raw) => {
    // If engagement slot provided is plural, make singular.
    if(engagement_raw[engagement_raw.length -1] === "s") {
        engagement_raw = engagement_raw.slice(0, -1);
    }

    // Capitalize to match output from Hubspot API.
    return engagement_raw.toUpperCase();
};
