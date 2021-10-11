const _ = require("lodash");
const {
  MAPLESTORY_COMMAND,
  LOSTARK_COMMAND,
  COMMON_COMMAND,
  MANAGER_COMMAND,
} = require("./config/constants.js");

function commonCommandValidator(message) {
  let messageSplit = message.split(" ");
  let service = null;
  for (const [key, services] of Object.entries(COMMON_COMMAND)) {
    _.forEach(services.methods, (method) => {
      let commands = _.cloneDeep(method.alias);
      commands.push(method.name);
      // let commands = _.concat(method.alias, method.name);
      if (commands.includes(messageSplit[0])) {
        service = {
          name: key,
          method,
        };
      }
    });
  }

  if (!service) {
    return;
  }

  return service;
}

function maplestoryCommandValidator(message) {
  let messageSplit = message.split(" ");
  let service = null;
  for (const [key, services] of Object.entries(MAPLESTORY_COMMAND)) {
    _.forEach(services.methods, (method) => {
      let commands = _.cloneDeep(method.alias);
      commands.push(method.name);
      // let commands = _.concat(method.alias, method.name);
      if (commands.includes(messageSplit[0])) {
        service = {
          name: key,
          method,
        };
      }
    });
  }

  if (!service) {
    return;
  }

  return service;
}

function lostarkCommandValidator(message) {
  let messageSplit = message.split(" ");
  let service = null;
  for (const [key, services] of Object.entries(LOSTARK_COMMAND)) {
    _.forEach(services.methods, (method) => {
      let commands = _.cloneDeep(method.alias);
      commands.push(method.name);
      // let commands = _.concat(method.alias, method.name);
      if (commands.includes(messageSplit[0])) {
        service = {
          name: key,
          method,
        };
      }
    });
  }

  if (!service) {
    return;
  }

  return service;
}

function managerCommandValidator(message) {
  let messageSplit = message.split(" ");
  let service = null;
  for (const [key, services] of Object.entries(MANAGER_COMMAND)) {
    _.forEach(services.methods, (method) => {
      let commands = _.cloneDeep(method.alias);
      commands.push(method.name);
      // let commands = _.concat(method.alias, method.name);
      if (commands.includes(messageSplit[0])) {
        service = {
          name: key,
          method,
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
  commonCommandValidator,
  maplestoryCommandValidator,
  lostarkCommandValidator,
  managerCommandValidator,
};
