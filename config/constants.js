/**
 * description : 기본 명령어
 */
const COMMAND_SELECTION = {
  methods: [
    {
      name: "!뭐먹지",
      alias: ["!ㅁㅁㅈ", "!aaw"],
      params: {
        type: "food",
      },
      description: "도움말에쓸말",
    },
    {
      name: "!뭐하지",
      alias: ["!ㅁㅎㅈ", "!agw"],
      params: {
        type: "doing",
      },
      description: "도움말에쓸말",
    },
    {
      name: "!채널",
      alias: ["!ㅊㄴ"],
      params: {
        type: "channel",
      },
      description: "도움말에쓸말",
    },
  ],
};

const COMMAND_HELP = {
  methods: [
    {
      name: "!도움말",
      alias: ["!ㄷㅇㅁ"],
      params: {},
      description: "도움말을 보여줍니다.",
    },
  ],
};

/**
 * description : 메이플스토리 명령어
 */
const COMMAND_MUTO = {
  methods: [
    {
      name: "!무토",
      alias: ["!ㅁㅌ"],
      description: "도움말에쓸말",
    },
  ],
};

const COMMAND_BOSS = {
  methods: [
    {
      name: "!보스",
      alias: ["!ㅄ", "!ㅂㅅ"],
      description: "도움말에쓸말",
    },
  ],
};

const COMMAND_MESO = {
  methods: [
    {
      name: "!메소",
      alias: ["!ㅁㅅ"],
      description: "도움말에쓸말",
    },
  ],
};

/**
 * description : 로스트아크 명령어
 */

const COMMAND_EMOTICONLIST = {
  methods: [
    {
      name: "!이모티콘리스트",
      alias: ["!ㅇㅁㅌㅋㄽㅌ", "!ㅇㅁㅌㅋㄹㅅㅌ"],
      description: "도움말에쓸말",
    },
  ],
};

const COMMAND_ADVENTURE_ISLAND = {
  methods: [
    {
      name: "!모험섬",
      alias: ["!ㅁㅎㅅ"],
      description: "도움말에쓸말",
    },
  ],
};

/**
 * description : 관리자 명령어
 */

const COMMAND_REGISTER = {
  methods: [
    {
      name: "!등록",
      alias: [],
    },
  ],
};

const MAPLESTORY_COMMAND = {
  MUTO: COMMAND_MUTO,
  BOSS: COMMAND_BOSS,
  MESO: COMMAND_MESO,
};
const LOSTARK_COMMAND = {
  EMOTICONLIST: COMMAND_EMOTICONLIST,
  ISLAND: COMMAND_ADVENTURE_ISLAND,
};
const COMMON_COMMAND = {
  HELP: COMMAND_HELP,
  SELECTION: COMMAND_SELECTION,
};

const MANAGER_COMMAND = {
  REGISTER: COMMAND_REGISTER,
};

module.exports = {
  MAPLESTORY_COMMAND,
  LOSTARK_COMMAND,
  COMMON_COMMAND,
  MANAGER_COMMAND,
};
