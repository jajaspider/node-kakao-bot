// const RANDOM_SELECTION = [
//   {
//     name: "food",
//     command: ["뭐먹지", "ㅁㅁㅈ", "aaw"],
//     type: "food",
//   },
//   {
//     name: "doing",
//     command: ["뭐하지", "ㅁㅎㅈ", "agw"],
//     type: "doing",
//   },
//   {
//     name: "channel",
//     command: ["!채널", "!ㅊㄴ"],
//     type: "channel",
//   },
// ];

const RANDOM_SELECTION = {
  service_name: "selection",
  methods: [
    {
      name: "뭐먹지",
      alias: ["ㅁㅁㅈ", "aaw"],
      params: { type: "food" },
      description: "도움말에쓸말",
    },
    {
      name: "뭐하지",
      alias: ["ㅁㅎㅈ", "agw"],
      params: { type: "doing" },
      description: "도움말에쓸말",
    },
  ],
};

const MAPLESTORY_COMMAND = [];
const LOSTARK_COMMAND = [];
const COMMON_COMMAND = [RANDOM_SELECTION];

module.exports = {
  MAPLESTORY_COMMAND,
  LOSTARK_COMMAND,
  COMMON_COMMAND,
  RANDOM_SELECTION,
};
