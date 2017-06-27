const elasticsearch  = require("elasticsearch");
const moment         = require("moment");
const config         = require(__dirname + "/../config/config.json");
const hubspot_helper = require(__dirname + "/../helpers/hubspot_helper");

const es = new elasticsearch.Client({ host : config.elasticsearch.host, log : "error" });

// Create the request into hubspot using the helper.
hubspot_helper.createRequest("/deals/v1/deal/paged?properties=dealstage&properties=amount", "GET", null).then((data) => {
    console.log("Running deals summarizer.");

    var body   = [];
    var stages = config.stages;

    // Loop through each of the deals.
    data.deals.forEach((deal) => {
        // Check each one of the stages if they match then create the object or
        // start calculating the total.
        stages.forEach((stage) => {
            // Total is not apart of the original object so one quick check
            // if it is undefined create it.
            if(stage.total === undefined) {
                stage.total = 0;
                stage.timestamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            }

            if(deal.properties.dealstage.value === stage.guid) {
                stage.total += parseFloat(deal.properties.amount.value);
            }
        });
    });

    // Loop back through the stages and use the data to create the index.
    stages.forEach((stage) => {
        body.push({
            index :  {
                _index : "deals-" + moment().utc().format('YYYY-MM-DD'),
                _type : "deal",
            }
        });

        body.push(stage);
    });

    return es.bulk({ body : body });
}).then((resp) => {
    if(resp.errors !== false) {
        console.log("Error processing elasticsearch request.");
    } else {
        console.log("Completed deals summarizer without errors.");
    }
}).catch((err) => {
    console.log(err);
});
