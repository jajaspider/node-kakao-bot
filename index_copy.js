const { commandValidator } = require("./commandManager");
let message = "agw 1";
let messageSplit = message.split(" ");

let serviceName = commandValidator(messageSplit[0]);

if (serviceName) {
  console.log(serviceName);
}
