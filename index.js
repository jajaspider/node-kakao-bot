const node_kakao = require("node-kakao");
const fs = require("fs");
const image_size = require("image-size");
const schedule = require("node-schedule");
const axios = require("axios");
const cheerio = require("cheerio");
const webdriver = require("selenium-webdriver");
const { By } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const shell = require("shelljs");
const download = require("image-downloader");
const { Carp } = require("./LostarkUpdater");
const logger = require("./logger/index");
const _ = require("lodash");
const selection = require("./api/selection.js");
const { CONNECTION_INFO } = require("./config/connection.js");
const Utils = require("./utils.js");
const commandManager = require("./commandManager");

const DEVICE_UUID = CONNECTION_INFO.DEVICE_UUID;
const DEVICE_NAME = CONNECTION_INFO.DEVICE_NAME;
const EMAIL = CONNECTION_INFO.EMAIL;
const PASSWORD = CONNECTION_INFO.PASSWORD;
const CLIENT = new node_kakao.TalkClient();

const COMPRES = "\u200b".repeat(500);

async function main() {
  const api = await node_kakao.AuthApiClient.create(DEVICE_NAME, DEVICE_UUID);
  const loginRes = await api.login({
    email: EMAIL,
    password: PASSWORD,

    // This option force login even other devices are logon
    forced: true,
  });

  if (!loginRes.success)
    throw new Error(`Web login failed with status: ${loginRes.status}`);
  logger.info(`Received access token: ${loginRes.result.accessToken}`);

  const res = await CLIENT.login(loginRes.result);
  if (!res.success) throw new Error(`Login failed with status: ${res.status}`);
  logger.info("Login success");
}

let notice_croll = schedule.scheduleJob("00 0-59 * * * *", function () {
  // maplestory_notice();
  // lostark_notice();
});

let probability_update = schedule.scheduleJob("00 30 10 * * 4", function () {
  probability_contents("로얄스타일");
  probability_contents("골드애플");
  probability_contents("원더베리");
  probability_contents("루나 크리스탈 스윗");
  probability_contents("루나 크리스탈 블랙");
});

CLIENT.on("chat", async (data, channel) => {
  const sender = data.getSenderInfo(channel);
  let data_split = data.text.trim().split(" ");
  // Change parameter name 21.09.17
  let messageSplit = data.text.trim().split(" ");
  if (!sender) return;

  logger.debug(
    `${String(data.getSenderInfo(channel)["nickname"])} : ${data.text}`
  );
  logger.debug(`userID : ${String(sender["userId"])}`);
  logger.debug(`linkID : ${String(sender["linkId"])}`);
  if (data.text.startsWith("!")) {
    logger.info(
      `${String(data.getSenderInfo(channel)["nickname"])}님이 ${
        data_split[0]
      } 명령어 사용 / 내용 : ${data.text}`
    );
  }

  // 디디님 userId 값 '8395929431908745003'
  if (
    String(sender["userId"]) === "8395929431908745003" ||
    String(sender["linkId"]) === "116430197"
  ) {
    if (data_split[0] === "!시트업데이트") {
      channel.sendChat("업데이트 시작");
      logger.debug(
        `${String(
          data.getSenderInfo(channel)["nickname"]
        )}님이 시트업데이트 시작`
      );
      let carp = new Carp();
      let updateResult = await carp.run();
      if (updateResult) {
        channel.sendChat("완료되었습니다.");
        logger.debug(`${String(data.getSenderInfo(channel)["nickname"])}완료`);
      }
    }
  }
  // 관리자 링크ID값 '116430197'
  if (String(sender["linkId"]) === "116430197") {
    if (messageSplit[0] === "파일") {
      try {
        let file_data = fs.readFileSync(`./${data_split[1]}.txt`, "utf8");
        channel.sendChat(file_data);
      } catch (e) {
        //ignore
      }
    }

    if (data.text.startsWith("!업데이트")) {
      switch (data_split[1]) {
        case "로얄스타일":
          probability_contents("로얄스타일");
          break;
        case "원더베리":
          probability_contents("원더베리");
          break;
        case "골드애플":
          probability_contents("골드애플");
          break;
        case "루나스윗":
          probability_contents("루나 크리스탈 스윗");
          break;
        case "루나드림":
          probability_contents("루나 크리스탈 드림");
          break;
      }
    }
  }

  let commonService = commandManager.commonCommandValidator(data.text);
  let maplestoryService = commandManager.maplestoryCommandValidator(data.text);
  let lostarkService = commandManager.lostarkCommandValidator(data.text);
  console.dir({
    commonService,
    maplestoryService,
    lostarkService,
  });
  let commonServiceName = _.get(commonService, "name");
  let maplestoryServiceName = _.get(maplestoryService, "name");
  let lostarkServiceName = _.get(lostarkService, "name");
  console.dir({
    commonServiceName,
    maplestoryService,
    lostarkService,
  });
  /**
   * description :  기본 명령어
   */
  if (commonServiceName == "SELECTION") {
    if (messageSplit.length === 1) {
      let result = await selection.getSelection(commonService.method.params);
      channel.sendChat(
        new node_kakao.ChatBuilder()
          .append(new node_kakao.ReplyContent(data.chat))
          .text(result)
          .build(node_kakao.KnownChatType.REPLY)
      );
    } else if (
      messageSplit.length >= 2 &&
      commonService.method.params.type != "channel"
    ) {
      let name = data.text.replace(messageSplit[0] + " ", "");
      let result = await selection.createSelection(
        name,
        String(data.getSenderInfo(channel)["nickname"]),
        commonService.method.params.type
      );
      channel.sendChat(result.message);
    } else {
      channel.sendChat("매개변수가 잘못되었습니다.");
    }
  }

  /**
   * description :  메이플스토리 명령어
   */
  if (maplestoryServiceName == "MUTO") {
    // 2021.10.11 S3로 변경 예정
    let muto_folder = "./무토";
    fs.readdir(muto_folder, function (error, filelist) {
      let idx = 0;
      while (idx < filelist.length) {
        if (messageSplit[1] === filelist[idx].split(".")[0]) {
          let file_name = muto_folder + "/" + filelist[idx];

          let dimensions = image_size(file_name);
          channel.sendMedia(node_kakao.KnownChatType.PHOTO, {
            name: filelist[idx],
            data: fs.readFileSync(file_name),
            width: dimensions.width,
            height: dimensions.height,
            ext: filelist[idx].split(".")[1],
          });
        }
        idx += 1;
      }
    });
  } else if (maplestoryServiceName == "BOSS") {
    channel.sendChat(boss_info(messageSplit[1], messageSplit[2]));
  } else if (maplestoryServiceName == "MESO") {
    let servers = [
      "스카니아",
      "베라",
      "루나",
      "제니스",
      "크로아",
      "유니온",
      "엘리시움",
      "이노시스",
      "레드",
      "오로라",
      "아케인",
      "노바",
    ];

    if (messageSplit.length === 1) {
      meso_info(channel, "엘리시움");
    }
    if (messageSplit.length === 2) {
      if (servers.indexOf(messageSplit[1]) !== -1) {
        meso_info(channel, messageSplit[1]);
      } else {
        channel.sendChat("잘못된 서버 이름입니다.");
      }
    }
  }
  /**
   * description : 로스트아크 명령어
   */
  if (lostarkServiceName == "EMOTICONLIST") {
    let emoticonList = lostarkEmoticonList();
    channel.sendChat(`사용 가능한 이모티콘 목록\n ${COMPRES} ${emoticonList}`);
  } else if (lostarkServiceName == "ISLAND") {
    channel.sendChat(await lostarkIsland());
  }

  if (data.text.endsWith("확률")) {
    channel.sendChat(
      new node_kakao.ChatBuilder()
        .append(new node_kakao.ReplyContent(data.chat))
        .text("확률 : " + Utils.getPercent() + "%")
        .build(node_kakao.KnownChatType.REPLY)
    );
  }

  let loa_folder = "./로아이미지";
  fs.readdir(loa_folder, function (error, filelist) {
    let idx = 0;
    while (idx < filelist.length) {
      if (data.text === filelist[idx].split(".")[0]) {
        let file_name = "./로아이미지/" + filelist[idx];
        let dimensions = image_size(file_name);
        channel.sendMedia(node_kakao.KnownChatType.PHOTO, {
          name: filelist[idx],
          data: fs.readFileSync(file_name),
          width: dimensions.width,
          height: dimensions.height,
          ext: filelist[idx].split(".")[1],
        });
      }
      idx += 1;
    }
  });

  if (data_split[0] === "!이모티콘등록") {
    // data.chat['attachment']['src_message'] == 사진

    for (let i = 0; i < channel["_chatListStore"]["_chatList"].length; i += 1) {
      // console.log(`${i} ${channel['_chatListStore']['_chatList'][i].attachment.url}`);
      // 같은 값이면
      if (
        String(channel["_chatListStore"]["_chatList"][i].logId) ===
        String(data.chat["attachment"]["src_logId"])
      ) {
        console.log(
          `${channel["_chatListStore"]["_chatList"][i].attachment.url}`
        );

        //이미지 확장자
        let ext = String(
          channel["_chatListStore"]["_chatList"][i].attachment.url
        )
          .split("/")
          .reverse()[0]
          .split(".")
          .reverse()[0];
        let fileName = `${data_split[1]}.${ext}`;

        console.log(fileName);

        const options = {
          url: String(channel["_chatListStore"]["_chatList"][i].attachment.url),
          dest: `./로아이미지/${fileName}`,
        };

        download
          .image(options)
          .then(({ filename }) => {
            console.log("Saved to", filename); // saved to /path/to/dest/photo.jpg
            channel.sendChat("등록되었습니다.");
          })
          .catch((err) => channel.sendChat("등록에 실패하였습니다."));
      }
    }
    // console.log(channel['_chatListStore']['_chatList']);
    // console.log(data.chat['attachment']['src_message']);
  }

  if (data_split[0] === "!이모티콘삭제") {
    let emoticonList = lostarkEmoticonList();
    if (emoticonList.includes(data_split[1])) {
      shell.exec(`rm ./로아이미지/${data_split[1]}.*`);
      channel.sendChat("이모티콘이 삭제되었습니다.");
    } else {
      channel.sendChat("등록되지않은 이모티콘입니다.");
    }
  }

  if (
    messageSplit[0] == "!앱솔" ||
    messageSplit[0] == "!앱솔랩스" ||
    messageSplit[0] == "!아케인" ||
    messageSplit[0] == "!아케인셰이드"
  ) {
    let result = await equipment(messageSplit[0], messageSplit[1]);
    if (!result) {
      channel.sendChat("잘못입력하셨습니다.");
      return;
    }
    channel.sendChat(result);
  }
  if (data.text === "!도움말") {
    let help_data = fs.readFileSync("./help.txt", "utf8");
    let return_string =
      "[SonaAPI 도움말]\n" + "아래 전체보기를 눌러주세요." + COMPRES + "\n\n\n";
    return_string += help_data;

    channel.sendChat(return_string);
  }

  // String(channel.channelId) 값으로 카톡을 보낼 수 있음.
  if (data_split[0] === "!알림" || data_split[0] === "!ㅇㄹ") {
    if (data_split.length === 1) {
      channel.sendChat(notification_status(String(channel.channelId)));
    }
    if (data_split.length === 2) {
      channel.sendChat(
        register_contents(data_split[1], String(channel.channelId))
      );
    }
  }

  if (data_split[0] === "!코로나" || data_split[0] === "!ㅋㄹㄴ") {
    getCorona(channel);
  }

  if (data_split[0] === "!수집물" || data_split[0] === "!ㅅㅈㅁ") {
    if (data_split.length === 1) {
      getCollection(
        channel,
        String(data.getSenderInfo(channel)["nickname"]).split("/")[0].trim()
      );
    }
    if (data_split.length === 2) {
      getCollection(channel, data_split[1]);
    }
  }

  if (data_split[0] === "!공지" || data_split[0] === "!ㄱㅈ") {
    channel.sendChat(viewNotice());
  }

  if (data_split[0] === "!크롬킬") {
    if (shell.exec("sudo pkill -9 -ef chrome").code !== 0) {
      channel.sendChat("Error: command failed");
    } else {
      channel.sendChat("성공");
    }
  }

  if (data_split[0] === "!MVP" || data_split[0] === "!mvp") {
    if (data_split.length === 2 && data_split[1] === "통계") {
      let mvpStatistics = "[MVP작 계산기]\n수치 100이 원금\n";
      let files = fs.readdirSync("./MVP");
      let meso = fs.readFileSync("./MVP/메소시세.txt");
      _.forEach(files, function (file) {
        if (file !== "메소시세.txt") {
          let itemName = _.split(file, ".")[0];
          let mvpStuff = fs.readFileSync(`./MVP/${file}`);

          let mvpStuffCharge = Number.parseInt(mvpStuff) * 0.97;
          let cash = _.split(_.split(file, "_")[2], ".")[0];
          let realCash = cash * 0.92;
          let cul = eval(
            `${mvpStuffCharge} / ${realCash} * ${Number.parseInt(
              meso
            )} / 1000000`
          );
          mvpStatistics += `\n${itemName} : ${cul.toFixed(4)}`;
        }
      });
      channel.sendChat(mvpStatistics);
    }
    if (data_split.length === 3) {
      try {
        let files = fs.readdirSync("./MVP");
        _.forEach(files, function (file) {
          if (file.includes(`${data_split[1]}`)) {
            fs.writeFileSync(`./MVP/${file}`, `${data_split[2]}`);
          }
        });
        channel.sendChat(
          `${data_split[1]} 품목 가격 ${data_split[2]} 적용완료`
        );
      } catch (ignore) {}
    }
  }

  // 확률형 아이템 3종 명령어
  let cash_item;
  switch (data_split[0]) {
    case "!로얄":
    case "!로얄스타일":
    case "!ㄹㅇㅅㅌㅇ":
    case "!ㄹㅇ":
      if (
        Number.parseInt(data_split[1]) <= 20000 &&
        Number.parseInt(data_split[1]) > 0
      ) {
        cash_item = set_probability("./royalstyle.txt");
        channel.sendChat(
          gamble("로얄스타일", cash_item, Number.parseInt(data_split[1]))
        );
      } else {
        channel.sendChat("반복횟수는 1회이상 20000회 이하입니다.");
      }
      break;
    case "!원기베리":
    case "!원더베리":
    case "!ㅇㄷㅂㄹ":
      if (
        Number.parseInt(data_split[1]) <= 20000 &&
        Number.parseInt(data_split[1]) > 0
      ) {
        cash_item = set_probability("./wonderberry.txt");
        channel.sendChat(
          gamble("원더베리", cash_item, Number.parseInt(data_split[1]))
        );
      } else {
        channel.sendChat("반복횟수는 1회이상 20000회 이하입니다.");
      }
      break;
    case "!골드애플":
    case "!독사과":
    case "!ㄱㄷㅇㅍ":
      if (
        Number.parseInt(data_split[1]) <= 20000 &&
        Number.parseInt(data_split[1]) > 0
      ) {
        cash_item = set_probability("./goldapple.txt");
        channel.sendChat(
          gamble("골드애플", cash_item, Number.parseInt(data_split[1]))
        );
      } else {
        channel.sendChat("반복횟수는 1회이상 20000회 이하입니다.");
      }
      break;
    case "!루나크리스탈":
    case "!ㄹㄴㅋㄽㅌ":
    case "!ㄹㄴㅋㄹㅅㅌ":
      if (
        Number.parseInt(data_split[1]) <= 1000 &&
        Number.parseInt(data_split[1]) > 0
      ) {
        cash_item = set_probability("./runasweet.txt");
        channel.sendChat(
          gamble("루나 블랙펫 합성", cash_item, Number.parseInt(data_split[1]))
        );
      } else {
        channel.sendChat("반복횟수는 1회이상 1000회 이하입니다.");
      }
      break;
    case "!루나크리스탈스윗":
    case "!ㄹㄴㅋㄽㅌㅅㅇ":
    case "!ㄹㄴㅋㄹㅅㅌㅅㅇ":
      if (
        Number.parseInt(data_split[1]) <= 1000 &&
        Number.parseInt(data_split[1]) > 0
      ) {
        cash_item = set_probability("./runadream.txt");
        channel.sendChat(
          gamble("루나 스윗펫 합성", cash_item, Number.parseInt(data_split[1]))
        );
      } else {
        channel.sendChat("반복횟수는 1회이상 1000회 이하입니다.");
      }
      break;
  }
});

async function lostarkIsland() {
  let islandList = [
    "하모니섬",
    "기회의섬",
    "볼라르섬",
    "메데이아",
    "포르페",
    "몬테섬",
    "수라도",
    "고요한안식의섬",
    "죽음의협곡",
    "블루홀",
    "쿵덕쿵아일랜드",
    "스오누팡아일랜드",
    "환영나비섬",
    "우거진갈대의섬",
  ];
  let payload = {
    server: "kr",
    date: `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
  };

  let result = await axios.post(
    "https://ark-api.bynn.kr/calendar/query",
    payload
  );

  let adventureIslandList = _.get(result.data, "adventureIslandList");
  // console.dir(adventureIslandList, {
  //   depth: null,
  // });

  let currentDate = getCurrentDate();
  // console.log(currentDate);

  let adventureIslands = _.filter(adventureIslandList, (object) => {
    return String(object.date).indexOf(currentDate) != -1;
  });

  // console.log(adventureIslands);

  let returnString = "[모험섬]";
  for (let adventureIsland of adventureIslands) {
    let islandName = islandList[Number.parseInt(adventureIsland.islandIdx)];
    let islandTime = `${adventureIsland.date}시`;
    let islandReward = null;
    if (adventureIsland.rewardId == "OCEAN") {
      islandReward = "항해주화";
    }
    if (adventureIsland.rewardId == "SILING") {
      islandReward = "실링";
    }
    if (adventureIsland.rewardId == "CARD") {
      islandReward = "카드";
    }
    if (adventureIsland.rewardId == "GOLD") {
      islandReward = "골드";
    }

    returnString =
      returnString + `\n\n${islandName}\n${islandTime}\n보상 : ${islandReward}`;
  }

  // console.log(returnString);
  return returnString;
}

function getCurrentDate() {
  let date = new Date();
  let year = date.getFullYear().toString();

  let month = date.getMonth() + 1;
  month = month < 10 ? "0" + month.toString() : month.toString();

  let day = date.getDate();
  day = day < 10 ? "0" + day.toString() : day.toString();

  return `${year}-${month}-${day}`;
}

function lostarkEmoticonList() {
  let loa_folder = "./로아이미지";
  let emoticonList = "";

  let fileList = fs.readdirSync(loa_folder);

  let idx = 0;
  while (idx < fileList.length) {
    emoticonList += "\n" + fileList[idx].split(".")[0];
    idx += 1;
  }

  return emoticonList;
}

function viewNotice() {
  let file_data = fs.readFileSync("./maplestory_notice.txt", "utf8");
  let data_split = file_data.split("\n");
  let idx = data_split.length - 6;
  let return_string =
    "[메이플 공지 확인]\n최근 5개만 보여줍니다." + COMPRES + "\n\n";
  while (idx < data_split.length - 1) {
    let noticeTitle = data_split[idx].split("|")[0];
    let noticeUrl = data_split[idx].split("|")[1];

    return_string +=
      "\n" + noticeTitle + "\nhttps://maplestory.nexon.com/" + noticeUrl + "\n";

    idx += 1;
  }
  return return_string;
}

const getCollection = async (channel, characterName) => {
  const screen = {
    width: 1280,
    height: 720,
  };
  let driver;
  try {
    driver = await new webdriver.Builder().forBrowser("chrome");
    let chromeOptions = new chrome.Options();
    const defaultChromeFlags = [
      "--headless",
      "--disable-gpu",
      "--window-size=1280x720",
      "--no-sandbox",
    ];
    chromeOptions.addArguments(defaultChromeFlags);
    driver.setChromeOptions(chromeOptions);
    driver = await driver.build();

    await driver.get(
      "https://lostark.game.onstove.com/Profile/Character/" +
        encodeURI(characterName)
    );
    await driver.sleep(2000);
    const collectionButton = await driver.findElement(
      By.xpath('//*[@id="profile-tab"]/div[1]/a[4]')
    );
    await collectionButton.click();
    const collectionIslandHeart = (
      await driver.findElement(By.xpath('//*[@id="tab1"]/div[1]/a[1]'))
    ).getText();
    const collectionOrpheusStar = (
      await driver.findElement(By.xpath('//*[@id="tab1"]/div[1]/a[2]'))
    ).getText();
    const collectionGiantHeart = (
      await driver.findElement(By.xpath('//*[@id="tab1"]/div[1]/a[3]'))
    ).getText();
    const collectionGreatArt = (
      await driver.findElement(By.xpath('//*[@id="tab1"]/div[1]/a[4]'))
    ).getText();
    const collectionMococoSeeds = (
      await driver.findElement(By.xpath('//*[@id="tab1"]/div[1]/a[5]'))
    ).getText();
    const collectionSailingAdventure = (
      await driver.findElement(By.xpath('//*[@id="tab1"]/div[1]/a[6]'))
    ).getText();
    const collectionIgneaMark = (
      await driver.findElement(By.xpath('//*[@id="tab1"]/div[1]/a[7]'))
    ).getText();
    const collectionTreeLeaf = (
      await driver.findElement(By.xpath('//*[@id="tab1"]/div[1]/a[8]'))
    ).getText();
    let returnstring = `[${characterName}]\n${await collectionIslandHeart}\n${await collectionOrpheusStar}\n${await collectionGiantHeart}\n${await collectionGreatArt}\n${await collectionMococoSeeds}\n${await collectionSailingAdventure}\n${await collectionIgneaMark}\n${await collectionTreeLeaf}`;
    channel.sendChat(returnstring);
  } catch (e) {
    console.log(e);
  }
  setTimeout(async () => {
    await driver.quit();
  }, 3000);
};

const getCorona = async (channel) => {
  const screen = {
    width: 1280,
    height: 720,
  };
  let driver;
  try {
    driver = await new webdriver.Builder().forBrowser("chrome");
    let chromeOptions = new chrome.Options();
    const defaultChromeFlags = [
      "--headless",
      "--disable-gpu",
      "--window-size=1280x720",
      "--no-sandbox",
    ];
    chromeOptions.addArguments(defaultChromeFlags);
    driver.setChromeOptions(chromeOptions);
    driver = await driver.build();

    await driver.get("https://corona-live.com/");
    const corona = await driver.findElement(
      By.xpath(
        '//*[@id="__next"]/div[2]/div[2]/div[4]/div[1]/div/div[1]/div[2]/div[2]/div[1]'
      )
    );
    let regex = /[^0-9]/g;
    let coronaCount = (await corona.getText()).replace(regex, "");
    channel.sendChat(`[코로나]\n실시간 확진자 : ${coronaCount}`);
  } catch (e) {
    console.log(e);
  }
  setTimeout(async () => {
    await driver.quit();
  }, 3000);
};

const meso_info = async (channel, server_name) => {
  const screen = {
    width: 1280,
    height: 720,
  };
  let driver;
  try {
    driver = await new webdriver.Builder().forBrowser("chrome");
    let chromeOptions = new chrome.Options();
    const defaultChromeFlags = [
      "--headless",
      "--disable-gpu",
      "--window-size=1280x720",
      "--no-sandbox",
    ];
    chromeOptions.addArguments(defaultChromeFlags);
    driver.setChromeOptions(chromeOptions);
    driver = await driver.build();

    await driver.get("https://talk.gamemarket.kr/maple/graph");
    const server_data = await driver.findElement(
      By.css(
        "#app > div > div > div.container.container--fluid > div > div:nth-child(2) > div > div.mt-2.pa-2.v-card.v-sheet.v-sheet--outlined.theme--light.rounded-0 > div.v-data-table.letter_spacing.v-data-table--dense.theme--light > div > table"
      )
    );
    // console.log(await server_data.getText());
    meso_data(channel, server_name, await server_data.getText());
  } catch (e) {
    console.log(e);
  }
  setTimeout(async () => {
    if (driver != null) {
      await driver.quit();
    }
  }, 3000);
};

async function meso_data(channel, server_name, temp) {
  let temp_split = String(temp).split("\n");
  let idx = 0;
  while (idx < temp_split.length) {
    if (temp_split[idx].includes(server_name)) {
      let one_line = temp_split[idx].split(" ");
      let return_string = `[${one_line[0]}]\n메소마켓 : ${one_line[1]}\n무통거래 : ${one_line[2]}`;
      channel.sendChat(return_string);
    }
    idx += 1;
  }
}

function lostark_notice() {
  let url = "https://lostark.game.onstove.com/News/Notice/List";

  async function getHTML() {
    try {
      let html = await axios.get(url);
      await lostark_notice_check(html);
    } catch (error) {
      console.log(error);
    }
  }

  getHTML();
}

async function lostark_notice_check(html) {
  const html_data = cheerio.load(html.data);
  let title_list = html_data(
    "#list > div.list.list--default > ul:nth-child(2) > li > a > div.list__subject > span.list__title"
  );
  let title_href = html_data(
    "#list > div.list.list--default > ul:nth-child(2) > li > a"
  );
  let file_name = "./lostark_notice.txt";
  let file_data = fs.readFileSync(file_name, "utf8");
  let return_string = "<로스트아크 공지 사항>";
  let new_notice_flag = false;

  let idx = 0;
  while (idx < title_list.length) {
    if (!file_data.includes(title_list[idx].children[0]["data"])) {
      console.log("**************새로운 공지 발견**************");
      new_notice_flag = true;
      return_string +=
        "\n\n" +
        title_list[idx].children[0]["data"] +
        "\n" +
        "https://lostark.game.onstove.com" +
        title_href[idx].attribs.href.split("?")[0];
      try {
        fs.appendFileSync(
          file_name,
          title_list[idx].children[0]["data"] +
            "|" +
            title_href[idx].attribs.href +
            "\n",
          (err) => {
            if (err) console.log(err);
          }
        );
      } catch (e) {
        console.log(e);
      }
    }
    idx += 1;
  }

  file_data = fs.readFileSync("./알림/로아공지.txt", "utf8");
  let data_split = file_data.split(",");

  if (new_notice_flag === true) {
    for (let i of CLIENT.channelList.open["_map"]) {
      if (data_split.indexOf(String(i[0])) !== -1) {
        // console.log(i[1]['_channel']);
        i[1].sendChat(return_string);
      }
    }
  }
}

function maplestory_notice() {
  let url = "https://maplestory.nexon.com/News/Notice";

  async function getHTML() {
    try {
      let html = await axios.get(url);
      await maplestory_notice_check(html);
    } catch (error) {
      console.log(error);
    }
  }

  getHTML();
}

async function maplestory_notice_check(html) {
  const html_data = cheerio.load(html.data);
  let title_list = html_data(
    "#container > div > div.contents_wrap > div.news_board > ul > li > p > a > span"
  );
  let title_href = html_data(
    "#container > div > div.contents_wrap > div.news_board > ul > li > p > a"
  );
  let file_name = "./maplestory_notice.txt";
  let file_data = fs.readFileSync(file_name, "utf8");
  let return_string = "<메이플 공지 사항>";
  let new_notice_flag = false;

  let idx = 0;
  while (idx < title_list.length) {
    if (!file_data.includes(title_list[idx].children[0]["data"])) {
      console.log("**************새로운 공지 발견**************");
      new_notice_flag = true;
      return_string +=
        "\n\n" +
        title_list[idx].children[0]["data"] +
        "\n" +
        "https://maplestory.nexon.com" +
        title_href[idx].attribs.href;
      try {
        fs.appendFileSync(
          file_name,
          title_list[idx].children[0]["data"] +
            "|" +
            title_href[idx].attribs.href +
            "\n",
          (err) => {
            if (err) console.log(err);
          }
        );
      } catch (e) {
        console.log(e);
      }
    }
    idx += 1;
  }

  file_data = fs.readFileSync("./알림/메이플공지.txt", "utf8");
  let data_split = file_data.split(",");

  if (new_notice_flag === true) {
    for (let i of CLIENT.channelList.open["_map"]) {
      if (data_split.indexOf(String(i[0])) !== -1) {
        // console.log(i[1]['_channel']);
        i[1].sendChat(return_string);
      }
    }
  }
}

function notification_status(channelId) {
  let folder = "./알림/";
  let return_string = "알림 현황\n";
  let file_list = fs.readdirSync(folder);
  let idx = 0;
  while (idx < file_list.length) {
    let file_data = fs.readFileSync(folder + file_list[idx], "utf8");
    if (file_data.indexOf(channelId) !== -1) {
      return_string += "\n" + file_list[idx].split(".")[0] + " : On";
    } else {
      return_string += "\n" + file_list[idx].split(".")[0] + " : Off";
    }
    idx += 1;
  }
  return return_string;
}

function boss_info(boss_name, boss_level = "하드") {
  let file_name = "./보스/" + boss_name + " " + boss_level + ".txt";

  try {
    let file_data = fs.readFileSync(file_name, "utf8");
    return file_data;
  } catch (e) {
    return "없는 보스명 입니다.";
  }
}

function gamble(method, cash_item, repeat) {
  let item_list = [];
  let idx = 0;
  while (idx < repeat) {
    let temp = Math.random();
    for (const [key, value] of Object.entries(cash_item)) {
      if (value >= temp) {
        item_list.push(key);
        // console.log(key);
        break;
      }
    }
    idx += 1;
  }

  let return_string =
    method + " " + String(repeat) + "개 결과" + COMPRES + "\n";
  for (const [key, value] of Object.entries(cash_item)) {
    return_string +=
      "\n" +
      key +
      " : " +
      String(item_list.filter((element) => key === element).length) +
      "개";
  }
  return return_string;
}

function set_probability(file_name) {
  let cash_item = {};
  let file_data = fs.readFileSync(file_name, "utf8");
  let data_split = file_data.split("\n");
  let idx = 0;
  let first_item_flag = true;
  while (idx < data_split.length) {
    let item_name = data_split[idx].split("|")[0];
    let item_per =
      Number.parseFloat(data_split[idx].split("|")[1].slice(0, -1)) / 100;

    if (first_item_flag) {
      cash_item[item_name] = item_per;
      first_item_flag = false;
    } else {
      cash_item[item_name] =
        item_per + cash_item[data_split[idx - 1].split("|")[0]];
    }

    idx += 1;
  }
  return cash_item;
}

// 확률 업데이트 함수 (목요일 10시30분마다 재실행)
function probability_contents(contents) {
  let url;
  let file_name;
  switch (contents) {
    case "로얄스타일":
      url =
        "https://maplestory.nexon.com/Guide/CashShop/Probability/RoyalStyle";
      file_name = "./royalstyle.txt";
      break;
    case "골드애플":
      url = "https://maplestory.nexon.com/Guide/CashShop/Probability/GoldApple";
      file_name = "./goldapple.txt";
      break;
    case "원더베리":
      url =
        "https://maplestory.nexon.com/Guide/CashShop/Probability/WispsWonderBerry";
      file_name = "./wonderberry.txt";
      break;
    case "루나 크리스탈 스윗":
      url =
        "https://maplestory.nexon.com/Guide/CashShop/Probability/LunaCrystalSweet";
      file_name = "./runasweet.txt";
      break;
    case "루나 크리스탈 드림":
      url =
        "https://maplestory.nexon.com/Guide/CashShop/Probability/LunaCrystalDream";
      file_name = "./runadream.txt";
      break;
    default:
      return "잘못 입력하셨습니다.";
  }

  async function getHTML() {
    try {
      let html = await axios.get(url);
      await set_probability_file(html, file_name);
    } catch (error) {
      console.log(error);
    }
  }

  getHTML();
}

async function set_probability_file(html, file_name) {
  const html_data = cheerio.load(html.data);
  let titlelist = html_data(
    "#container > div > div.contents_wrap > table > tbody > tr"
  );
  let item_list = titlelist.children("td");

  let idx = 0;
  let royal_list = {};
  while (idx < item_list.length) {
    if (item_list[idx].children[0]["type"] === "text") {
      let filter_list = [
        "골드애플",
        "로얄스타일",
        "노멀 아이템",
        "상급 아이템",
        "희귀 아이템",
        "루나 스윗 펫",
        "루나 드림 펫",
        "루나 쁘띠 펫",
        "루나 쁘띠 공용 펫장비",
      ];
      if (filter_list.includes(item_list[idx].children[0]["data"])) {
        idx += 1;
      }
    }
    let item_name = item_list[idx].children[0].firstChild["data"];
    let item_percentage = item_list[idx + 1].children[0]["data"];
    royal_list[item_name] = item_percentage;
    idx += 2;
  }
  let first_line_flag = true;
  fs.unlink(file_name, (err) => {
    if (err) console.log(err);
  });

  for (const [key, value] of Object.entries(royal_list)) {
    if (!first_line_flag) {
      fs.appendFileSync(file_name, "\n", (err) => {
        if (err) console.log(err);
      });
    }
    fs.appendFileSync(file_name, key + "|" + value, (err) => {
      if (err) console.log(err);
    });
    first_line_flag = false;
  }
}

function contents_timer(contents) {
  let file_name = "";
  switch (contents) {
    case "모험섬":
      file_name = "./알림/모험섬.txt";
      break;
    case "카오스게이트":
      file_name = "./알림/카오스게이트.txt";
      break;
    case "필드보스":
      file_name = "./알림/필드보스.txt";
      break;
  }
  let file_data = fs.readFileSync(file_name, "utf8");
  let data_split = file_data.split(",");

  for (let i of CLIENT.channelList.open["_map"]) {
    if (data_split.indexOf(String(i[0])) !== -1) {
      // console.log(i[1]['_channel']);
      i[1].sendChat(contents + " 시작 10분전입니다.");
    }
  }
}

function register_contents(contents, channelId) {
  let file_name = "";
  switch (contents) {
    case "모험섬":
      file_name = "./알림/모험섬.txt";
      break;
    case "카게":
    case "카오스게이트":
      file_name = "./알림/카오스게이트.txt";
      break;
    case "필보":
    case "필드보스":
      file_name = "./알림/필드보스.txt";
      break;
    case "메이플공지":
    case "메이플스토리공지":
      file_name = "./알림/메이플공지.txt";
      break;
    case "로아공지":
    case "로스트아크공지":
      file_name = "./알림/로아공지.txt";
      break;
    default:
      return "잘못된 알림명입니다.";
  }

  let file_data = fs.readFileSync(file_name, "utf8");
  let data_split = file_data.split(",");
  // 이미 등록되어있으면 삭제
  if (data_split.indexOf(channelId) !== -1) {
    data_split.splice(data_split.indexOf(channelId), 1);
    fs.writeFile(file_name, data_split.join(), function (err) {
      if (err) {
        return "알림변경에 실패하였습니다.";
      }
    });
    return contents + " 알림 ON -> Off";
  }
  // 등록 안되어있다면 등록
  else {
    data_split.push(channelId);
    fs.writeFile(file_name, data_split.join(), function (err) {
      if (err) {
        return "알림변경에 실패하였습니다.";
      }
    });
    return contents + " 알림 Off -> ON";
  }
}

let absolabArmor = [
  "앱솔랩스나이트글러브",
  "앱솔랩스나이트숄더",
  "앱솔랩스나이트슈즈",
  "앱솔랩스나이트슈트",
  "앱솔랩스나이트케이프",
  "앱솔랩스나이트헬름",
  "앱솔랩스메이지글러브",
  "앱솔랩스메이지숄더",
  "앱솔랩스메이지슈즈",
  "앱솔랩스메이지슈트",
  "앱솔랩스메이지케이프",
  "앱솔랩스메이지크라운",
  "앱솔랩스시프글러브",
  "앱솔랩스시프숄더",
  "앱솔랩스시프슈즈",
  "앱솔랩스시프슈트",
  "앱솔랩스시프캡",
  "앱솔랩스시프케이프",
  "앱솔랩스아처글러브",
  "앱솔랩스아처숄더",
  "앱솔랩스아처슈즈",
  "앱솔랩스아처슈트",
  "앱솔랩스아처케이프",
  "앱솔랩스아처후드",
  "앱솔랩스파이렛글러브",
  "앱솔랩스파이렛숄더",
  "앱솔랩스파이렛슈즈",
  "앱솔랩스파이렛슈트",
  "앱솔랩스파이렛케이프",
  "앱솔랩스파이렛페도라",
];

let absolabWeapon = [
  "앱솔랩스파일 갓",
  "앱솔랩스포인팅건",
  "앱솔랩스피어싱스피어",
  "앱솔랩스핀쳐케인",
  "앱솔랩스핼버드",
  "앱솔랩스에너지소드",
  "앱솔랩스에센스",
  "앱솔랩스에인션트 보우",
  "앱솔랩스엑스",
  "앱솔랩스체인",
  "앱솔랩스크로스보우",
  "앱솔랩스튜너",
  "앱솔랩스브로드세이버",
  "앱솔랩스브로드엑스",
  "앱솔랩스브로드해머",
  "앱솔랩스블래스트캐논",
  "앱솔랩스블레이드",
  "앱솔랩스블로우너클",
  "앱솔랩스비트해머",
  "앱솔랩스샤이닝로드",
  "앱솔랩스세이버",
  "앱솔랩스소울슈터",
  "앱솔랩스슈팅보우",
  "앱솔랩스스펠링스태프",
  "앱솔랩스스펠링완드",
  "앱솔랩스슬래셔",
  "앱솔랩스데스페라도",
  "앱솔랩스듀얼보우건",
  "앱솔랩스리벤지가즈",
  "앱솔랩스매직 건틀렛",
  "앱솔랩스ESP리미터",
  "앱솔랩스괴선",
];

let arcaneArmor = [
  "아케인셰이드나이트글러브",
  "아케인셰이드나이트숄더",
  "아케인셰이드나이트슈즈",
  "아케인셰이드나이트슈트",
  "아케인셰이드나이트케이프",
  "아케인셰이드나이트햇",
  "아케인셰이드메이지글러브",
  "아케인셰이드메이지숄더",
  "아케인셰이드메이지슈즈",
  "아케인셰이드메이지슈트",
  "아케인셰이드메이지케이프",
  "아케인셰이드메이지햇",
  "아케인셰이드시프글러브",
  "아케인셰이드시프숄더",
  "아케인셰이드시프슈즈",
  "아케인셰이드시프슈트",
  "아케인셰이드시프케이프",
  "아케인셰이드시프햇",
  "아케인셰이드아처글러브",
  "아케인셰이드아처숄더",
  "아케인셰이드아처슈즈",
  "아케인셰이드아처슈트",
  "아케인셰이드아처케이프",
  "아케인셰이드아처햇",
  "아케인셰이드파이렛글러브",
  "아케인셰이드파이렛숄더",
  "아케인셰이드파이렛슈즈",
  "아케인셰이드파이렛슈트",
  "아케인셰이드파이렛케이프",
  "아케인셰이드파이렛햇",
];

let arcaneWeapon = [
  "아케인셰이드ESP리미터",
  "아케인셰이드가즈",
  "아케인셰이드대거",
  "아케인셰이드데스페라도",
  "아케인셰이드듀얼보우건",
  "아케인셰이드매직 건틀렛",
  "아케인셰이드보우",
  "아케인셰이드블레이드",
  "아케인셰이드샤이닝로드",
  "아케인셰이드세이버",
  "아케인셰이드소울슈터",
  "아케인셰이드스태프",
  "아케인셰이드스피어",
  "아케인셰이드시즈건",
  "아케인셰이드에너지체인",
  "아케인셰이드에센스",
  "아케인셰이드에인션트 보우",
  "아케인셰이드엑스",
  "아케인셰이드엘라하",
  "아케인셰이드완드",
  "아케인셰이드체인",
  "아케인셰이드초선",
  "아케인셰이드케인",
  "아케인셰이드크로스보우",
  "아케인셰이드클로",
  "아케인셰이드투핸드소드",
  "아케인셰이드투핸드엑스",
  "아케인셰이드투핸드해머",
  "아케인셰이드튜너",
  "아케인셰이드폴암",
  "아케인셰이드피스톨",
  "아케인셰이드해머",
];

async function equipment(kinds, type) {
  let items = [];
  let itemClassfication = "";
  if (kinds == "!앱솔랩스" || kinds == "!앱솔") {
    itemClassfication = "앱솔랩스";
    if (type == "무기") {
      items = absolabWeapon;
    } else if (type == "방어구") {
      items = absolabArmor;
    } else {
      return;
    }
  } else if (kinds == "!아케인셰이드" || kinds == "!아케인") {
    itemClassfication = "아케인셰이드";
    if (type == "무기") {
      items = arcaneWeapon;
    } else if (type == "방어구") {
      items = arcaneArmor;
    } else {
      return;
    }
  }
  let Prices = [];
  for (let item of items) {
    try {
      let uri = `https://maple.market/items/${item}/엘리시움`;
      let result = await axios.get(encodeURI(uri));
      let htmlData = cheerio.load(result.data);
      let itemPrice = htmlData(
        "#auction-list > table > tbody > tr:nth-child(1) > td"
      );
      let itemName = htmlData(
        "#auction-list > table > tbody > tr:nth-child(1) > td.text-left > span"
      );

      let unitPrice = null;
      let priceRegax = /[^0-9가-힇 ]/g;
      let nameRegax = /[^가-힇 ]/g;

      unitPrice = itemPrice[itemPrice.length - 3]["children"][2].data;
      unitPrice = unitPrice.replace(priceRegax, "").trim();

      itemPrice = itemPrice[itemPrice.length - 3]["children"][0].data;
      itemPrice = itemPrice.replace(priceRegax, "").trim();

      itemName = itemName[0]["children"][0].data;
      itemName = itemName
        .replace(nameRegax, "")
        .trim()
        .replace(itemClassfication, "");

      Prices.push({
        itemName,
        unitPrice,
        itemPrice,
      });
    } catch (e) {
      let nameRegax = /[^가-힇 ]/g;
      itemName = item
        .replace(nameRegax, "")
        .trim()
        .replace(itemClassfication, "");
      unitPrice = "0";
      itemPrice = "0";

      Prices.push({
        itemName,
        unitPrice,
        itemPrice,
      });
    }
  }

  Prices.sort((a, b) => {
    if (parseInt(a.itemPrice) > parseInt(b.itemPrice)) {
      return -1;
    }
    if (parseInt(a.itemPrice) < parseInt(b.itemPrice)) {
      return 1;
    }
  });

  let priceString = "[경매장 결과]\n" + COMPRES;
  for (let price of Prices) {
    priceString += `\n${price.itemName} : ${price.unitPrice}`;
  }

  return priceString;
}

main().then();
