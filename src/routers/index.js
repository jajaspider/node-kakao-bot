const maplestory = require("./maplestory");
const lostark = require("./lostark");
const manage = require("./manage");
const { getRoomTypes } = require("../utils/room");
const _ = require("lodash");

function router(data, channel) {
  let roomNumber = _.get(channel, "_channel.channelId").toString();
  let roomTypes = getRoomTypes(roomNumber);
  if (!roomTypes) {
    throw new error(`${roomNumber} is roomTypes`);
  }

  // for (let roomType of roomTypes) {
  //   //romomType = LOSTARK_COMMAND
  //   if (roomType == "LOSTARK_COMMAND") {
  //     result = lostark.함수(chatInfo);
  //   } else if (roomType == "MAPLESTORY_COMMAND") {
  //     result = maplestory.함수(chatInfo);
  //   } else if (roomType == "MANAGE_COMMAND") {
  //   } else if (roomType == "COMMON_COMMAND") {
  //   }
  // }
  // return result;
}
//module export 필요
module.exports = router;
