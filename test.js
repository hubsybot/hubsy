const config         = require(__dirname + "/config/config.json");
const hubspot_helper = require(__dirname + "/helpers/hubspot_helper");
const similarity     = require("string-similarity");

hubspot_helper.createRequest("/deals/v1/deal/paged?properties=dealstage&properties=dealname&properties=hubspot_owner_id", "GET", null).then((body) => {
    var str = "house of worship church";

    body.forEach((data) => {
        data.deals.forEach((deal) => {
            var percentage = Math.round(parseFloat(similarity.compareTwoStrings(str, deal.properties.dealname.value)) * 100) / 100;

            if(percentage > 0.5) {
                console.log(`FOUND (${percentage}): ${deal.properties.dealname.value}`);
            } else {
                console.log(`NO (${percentage}): ${deal.properties.dealname.value}`);
            }
        });
    });
});
