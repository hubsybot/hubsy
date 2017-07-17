/**
 * Intent:
 *   help
 *
 * Description:
 *   The help command will give the user examples of things to say.
 *
 * Commands:
 *   Help
 */
const lambda_helper = require(__dirname + "/helpers/lambda_helper");

exports.handler = (event, context, callback) => {
    var message = `For example you could ask me to do things like:\n\n`;
    message = message + `- Create a task for Andy. \n`;
    message = message + `- Create a new contact. \n`;
    message = message + `- Update the contact batman@example.com. \n`;
    message = message + `- How many tasks are assigned to Andrew today? \n`;
    message = message + `- How many calls has Andy made today?\n`;
    message = message + `- Any new deals? \n`;
    message = message + `- Can you tell me the contact info for Sansa? \n`;
    message = message + `- How many deals are in the discovery stage? \n\n`;
    message = message + `So go ahead and ask away!`;

    return lambda_helper.processCallback(callback, event, "Fulfilled", message);
};
