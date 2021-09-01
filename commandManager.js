const _ = require("lodash");
const selection = require("./api/selection.js");
const { COMMON_COMMAND } = require("./config/constants.js");
const node_kakao = require("node-kakao");

async function commandValidator(data, channel) {
  let msgSplit = data.text.split(" ");
  let service = null;
  let command;
  _.forEach(COMMON_COMMAND, (commandService) => {
    command = _.filter(commandService, (row) => {
      return row.command.includes(msgSplit[0]);
    });

    for (const [key, value] of Object.entries(COMMON_COMMAND)) {
      if (value == commandService) {
        service = key;
      }
    }
  });
  command = command[0];
  if (!command) {
    return;
  }

  if (service == "RANDOM_SELECTION") {
    if (msgSplit.length === 1) {
      let result = await selection.getSelection(command.type);
      //   return result;
      channel.sendChat(
        new node_kakao.ChatBuilder()
          .append(new node_kakao.ReplyContent(data.chat))
          .text(result)
          .build(node_kakao.KnownChatType.REPLY)
      );
    }
    // 명령어의 매개변수가 2개이상일 경우 post하여 신규값
    else if (msgSplit.length >= 2 && command.type != "channel") {
      let name = msg.replace(msgSplit[0] + " ", "");
      let result = await selection.createSelection(
        name,
        String(data.getSenderInfo(channel)["nickname"]),
        command.type
      );
      channel.sendChat(result.message);
      //   return result;
    } else {
      //   return "매개변수가 잘못되었습니다.";
      channel.sendChat("매개변수가 잘못되었습니다.");
    }
  }
}

module.exports = { commandValidator };
