const _ = require("lodash");
const {
  COMMON_COMMAND
} = require("./config/constants.js");

function commonCommandValidator(message) {
  let messageSplit = message.split(" ");
  let service = null;
  for (const [key, services] of Object.entries(COMMON_COMMAND)) {
    _.forEach(services.methods, (method) => {
      let commands = _.concat(method.alias, method.name);
      if (commands.includes(messageSplit[0])) {
        service = {
          name: key,
          method
        };
      }
    });
  }

  if (!service) {
    return;
  }

  return service;
}

module.exports = {
  commonCommandValidator
};