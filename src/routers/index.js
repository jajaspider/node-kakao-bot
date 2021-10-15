const maplestory = require("./maplestory");
const lostark = require("./lostark");
const manage = require("./manage");
const { getRoomTypes } = require("../utils/room");
const { result } = require("lodash");

function route(chatInfo) {
  let roomNubmer = _.get(chatInfo, "roomNumber");
  let roomTypes = getRoomTypes(roomNubmer);
  let result = {
    isSuccess: false,
  };
  for (let roomType of roomTypes) {
    //romomType = LOSTARK_COMMAND
    if (roomType == "LOSTARK_COMMAND") {
      result = lostark.함수(chatInfo);
    } else if (roomType == "MAPLESTORY_COMMAND") {
      result = maplestory.함수(chatInfo);
    } else if (roomType == "MANAGE_COMMAND") {
    } else if (roomType == "COMMON_COMMAND") {
    }
  }
  return result;
}
//module export 필요
module.exports = type_classfication;
