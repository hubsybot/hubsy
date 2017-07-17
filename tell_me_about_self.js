/**
 * Intent:
 *   tell_me_about_self
 *
 * Description:
 *   Hubsy will give you a brief description and tell you to find out more on hubsy.com
 *
 * Commands:
 *   Tell me about itself
 *   Tell me about yourself
 *   Tell me about herself
 *   Tell me about himself
 */
const lambda_helper = require(__dirname + "/helpers/lambda_helper");

exports.handler = (event, context, callback) => {
    return lambda_helper.processCallback(callback, event, "Fulfilled", `Hi.\nI am Hubsy.\nI am your HubSpot personal assistant!\nWhat shall I do for you today?`);
};
