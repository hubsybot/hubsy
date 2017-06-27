exports.handler = (event, context, callback) => {
    var intent = null;

    switch(event.request.intent.name) {
        case "DealsInStage":
            intent = require(__dirname + "/deals_in_stage");
            break;
        case "TotalInDeals":
            intent = require(__dirname + "/total_in_deals");
            break;
    }

    if(intent !== null) {
        intent.handler(event, context, callback);
    }
};
