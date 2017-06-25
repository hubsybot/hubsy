/**
 * Intent: TotalInDeals
 *
 * Commands (Variations of commands are available. See Lex intent for details.)
 *
 * What is the total value of deals in the {stage}​ stage.
 *
 * @TODO This is a paged call so we will need to work with multiple pages potentially.
 */

// Include the config and helpers.
const config         = require(__dirname + "/config/config.json");
const hubspot_helper = require(__dirname + "/hubspot_helper");
const lambda_helper  = require(__dirname + "/lambda_helper");

// Handler for the Lambda function.
exports.handler = (event, context, callback) => {
    return lambda_helper.processCloseCallback(callback, "Fulfilled", "testing new intent");
};
