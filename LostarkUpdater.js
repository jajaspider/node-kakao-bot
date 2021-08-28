const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const _ = require("lodash");
const { SPREADSHEET_INFO } = require("./config/connection.js");

let guildUserCount = 18;
let guildCharacterCount = 15;
const creds = require("./config/lostarkupdater-6592a098bcaf.json");
const doc = new GoogleSpreadsheet(SPREADSHEET_INFO.JSKEY);

async function deletesheet(sheetNumber) {
  await doc.useServiceAccountAuth(creds);

  // 도큐먼트 정보를 가져옴
  await doc.loadInfo();
  // 해당 도큐먼트의 시트0번째를 가져옴
  const sheet = doc.sheetsByIndex[sheetNumber];
  // 셀들을 load
  await sheet.loadCells();

  // 기존 포맷 전부 삭제 및 데이터 삭제
  for (let i = 0; i < guildUserCount + 1; i += 1) {
    for (let j = 0; j < guildCharacterCount + 1; j += 1) {
      sheet.getCell(62 + i, 3 + j).clearAllFormatting();
    }
  }
  await sheet.saveUpdatedCells();
  for (let i = 0; i < guildUserCount + 1; i += 1) {
    for (let j = 0; j < guildCharacterCount; j += 1) {
      sheet.getCell(62 + i, 3 + j).value = "";
      sheet.getCell(62 + i, 3 + j).backgroundColor = {
        red: 0.9372549,
        green: 0.9372549,
        blue: 0.9372549,
      };
    }
  }
  await sheet.saveUpdatedCells();
}

// 시트에있는 캐릭터 이름 가져오는 함수
async function loadsheet(sheetNumber) {
  await doc.useServiceAccountAuth(creds);
  // 도큐먼트 정보를 가져옴
  await doc.loadInfo();
  // 해당 도큐먼트의 시트0번째를 가져옴
  const sheet = doc.sheetsByIndex[sheetNumber];
  // 셀들을 load
  await sheet.loadCells();
  let originCharacter = [];
  for (let i = 0; i < guildUserCount; i += 1) {
    // console.log(sheet.getCell(63 + i, 3).value);
    originCharacter[i] = String(sheet.getCell(63 + i, 2).value);
    // await getLostarkCharacterList(originCharacter[i]);
  }
  // console.log('originCharacter');
  // console.dir(originCharacter);
  return originCharacter;
}

//캐릭터에 리스트를 뽑아오기위한 html 함수
async function getLostarkCharacterList(characters) {
  let characterList = [];
  let datas = null;
  for (let character of characters) {
    let url =
      "https://lostark.game.onstove.com/Profile/Character/" +
      encodeURI(character);
    let html = await axios.get(url);
    let loadData = cheerio.load(html.data);
    datas = loadData("#expand-character-list > ul > li > span > button > span");

    let characterNames = [];
    for (let data of datas) {
      let characterName = data.children[0]["data"];
      characterNames.push(characterName);
      // console.log(characterName);
    }
    characterList.push(characterNames);
  }
  // console.log('characterList');
  // console.dir(characterList);
  return characterList;
}

async function getLostarkCharacter(characterList) {
  let subcharacterList = [];

  for (let i = 0; i < characterList.length; i += 1) {
    let subList = [];
    for (let j = 0; j < characterList[i].length; j += 1) {
      let url =
        "https://lostark.game.onstove.com/Profile/Character/" +
        encodeURI(characterList[i][j]);
      let html = await axios.get(url);
      let loadData = cheerio.load(html.data);
      if (
        loadData(
          "#lostark-wrapper > div > main > div > div.profile-character-info > span.profile-character-info__server"
        )
          .text()
          .includes("실리안")
      ) {
        let characterNameTag = loadData(
          "#lostark-wrapper > div > main > div > div.profile-character-info > span.profile-character-info__name"
        );
        let characterName = characterNameTag[0].attribs.title;
        let characterLevel = loadData(
          "#lostark-wrapper > div > main > div > div.profile-ingame > div.profile-info > div.level-info2 > div.level-info2__expedition > span:nth-child(2)"
        ).text();
        characterLevel = characterLevel.split(".")[1];
        let regex = /[^0-9]/g;
        characterLevel = characterLevel.replace(regex, "");
        subList.push([characterName, characterLevel]);
      }
    }
    subList.sort(function (a, b) {
      return b[1] - a[1];
    });
    subcharacterList.push(subList);
  }
  // console.log('subcharacterList');
  // console.dir(subcharacterList);
  return subcharacterList;
}

async function writeArray(sheetNumber, characterList) {
  // console.log(characterArray);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[sheetNumber];
  await sheet.loadCells();
  // 0 -> B
  let column = 2;
  //{ red: 0.7882353, green: 0.85490197, blue: 0.972549 }
  let low = 63;
  let max = 1;
  // let currentSection = 0;

  let levelSection = [
    // {level: '1475', backgroundColor: {"red": 255, "green": 0, "blue": 0, "alpha": 255}},
    {
      level: "1460",
      backgroundColor: {
        red: 0.8117647,
        green: 0.8862745,
        blue: 0.9529412,
      },
    },
    {
      level: "1445",
      backgroundColor: {
        red: 0.7882353,
        green: 0.85490197,
        blue: 0.972549,
      },
    },
    {
      level: "1430",
      backgroundColor: {
        red: 0.95686275,
        green: 0.8,
        blue: 0.8,
      },
    },
    {
      level: "1415",
      backgroundColor: {
        red: 0.9882353,
        green: 0.8980392,
        blue: 0.8039216,
      },
    },
    {
      level: "1400",
      backgroundColor: {
        red: 0.8509804,
        green: 0.8235294,
        blue: 0.9137255,
      },
    },
    {
      level: "1370",
      backgroundColor: {
        red: 0.8156863,
        green: 0.8784314,
        blue: 0.8901961,
      },
    },
    {
      level: "1325",
      backgroundColor: {
        red: 1,
        green: 0.9490196,
        blue: 0.8,
      },
    },
  ];

  for (let i = 0; i < levelSection.length; i += 1) {
    column += max;
    max = 1;
    const sectionCell = sheet.getCell(low - 1, column);
    sectionCell.value = levelSection[i].level;
    sectionCell.backgroundColor = levelSection[i].backgroundColor;
    sectionCell.horizontalAlignment = "CENTER";
    // j는 사람
    for (let j = 0; j < characterList.length; j += 1) {
      let width = 0;
      //k 는 캐릭터 갯수
      for (let k = 0; k < characterList[j].length; ) {
        const currentCell = sheet.getCell(low + j, column + width);
        // console.log(`${j} ${k} ${characterArray[j][k][1]}`);
        if (
          Number.parseInt(characterList[j][k][1]) >=
          Number.parseInt(levelSection[i].level)
        ) {
          currentCell.value = String(characterList[j][k][0]);
          currentCell.backgroundColor = levelSection[i].backgroundColor;
          currentCell.horizontalAlignment = "CENTER";
          // console.dir(characterArray[j]);
          characterList[j].shift();
          width += 1;
        } else {
          break;
        }
      }
      if (max <= width) {
        max = width;
      }
    }
  }
  // console.log(characterArray);
  await sheet.saveUpdatedCells();
}

async function getFormat() {
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[3];
  await sheet.loadCells();

  const sectionCell = sheet.getCell(29, 2);
  console.log(sectionCell.backgroundColor);
}

async function sheetControl(nickname) {
  let sheetNumber = 0;
  await deletesheet(sheetNumber);
  let characters = await loadsheet(sheetNumber);
  let characterList = await getLostarkCharacterList(characters);
  let subCharacterList = await getLostarkCharacter(characterList);
  await writeArray(sheetNumber, subCharacterList);
}
// sheetControl().then(r => {
//     console.log("완료");
// });

// sheetControl();
module.exports = {
  sheetControl,
};
// writeArray();
// getFormat();
