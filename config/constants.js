const COMMAND_SELECTION = {
  methods: [{
      name: "!뭐먹지",
      alias: ["!ㅁㅁㅈ", "!aaw"],
      params: {
        type: "food"
      },
      description: "도움말에쓸말",
    },
    {
      name: "!뭐하지",
      alias: ["!ㅁㅎㅈ", "!agw"],
      params: {
        type: "doing"
      },
      description: "도움말에쓸말",
    },
  ],
};

const COMMAND_HELP = {
  methods: [{
    name: "!도움말",
    alias: [""],
    params: {},
    description: "도움말을 보여줍니다."
  }]
}


const MAPLESTORY_COMMAND = [];
const LOSTARK_COMMAND = [];
const COMMON_COMMAND = {
  HELP: COMMAND_HELP,
  SELECTION: COMMAND_SELECTION
};

module.exports = {
  MAPLESTORY_COMMAND,
  LOSTARK_COMMAND,
  COMMON_COMMAND,
};