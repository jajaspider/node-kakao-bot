const _ = require("lodash");
const { COMMON_COMMAND } = require("./config/constants.js");

function commandValidator(message) {
  let serviceName = null;
  _.forEach(COMMON_COMMAND, (services) => {
    let isCommand = false;
    _.forEach(services.methods, (service) => {
      let result = null;
      result = _.includes(service.name, message);
      if (result) {
        isCommand = true;
        return;
      }
      result = _.includes(service.alias, message);
      if (result) {
        isCommand = true;
        return;
      }
    });
    if (isCommand) {
      // console.log(services.service_name);
      serviceName = services.service_name;
    }
  });
  if (serviceName) {
    return serviceName;
  }
}

module.exports = { commandValidator };
