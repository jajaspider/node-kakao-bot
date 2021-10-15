const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { runInContext } = require("lodash");
const _ = require("lodash");
const { SPREADSHEET_INFO } = require("./config/connection.js");

class Carp {
  constructor() {
    this.userCount = 0;
    this.characterCount = 0;
    this.sheetNumber = 3;
    this.creds = require("./config/lostarkupdater-6592a098bcaf.json");
    this.doc = new GoogleSpreadsheet(SPREADSHEET_INFO.JSKEY);
    this.characterList = [];
    this.characterExpand = [];
    this.charactersDatail = [];
  }

  async loadSpreadSheet() {
    await this.doc.useServiceAccountAuth(this.creds);
    // 도큐먼트 정보를 가져옴
    await this.doc.loadInfo();
    // 해당 도큐먼트의 시트0번째를 가져옴
    this.sheet = this.doc.sheetsByIndex[this.sheetNumber];
    // 셀들을 load
    await this.sheet.loadCells();
  }

  async findIndex() {
    let rowCount = _.get(this.sheet, "_rawProperties.gridProperties.rowCount");
    let columnCount = _.get(
      this.sheet,
      "_rawProperties.gridProperties.columnCount"
    );

    for (let i = 0; i < columnCount; i += 1) {
      for (let j = 0; j < rowCount; j += 1) {
        if (this.sheet.getCell(j, i).value == "캐릭터감지") {
          this.rowCount = j;
          this.columnCount = i;
        }
      }
    }
  }

  async findCharacter() {
    for (
      let i = this.rowCount + 2;
      i < _.get(this.sheet, "_rawProperties.gridProperties.rowCount");
      i += 1
    ) {
      if (this.sheet.getCell(i, this.columnCount).value == null) {
        break;
      }
      this.characterList.push(this.sheet.getCell(i, this.columnCount).value);
    }
    this.characterCount = this.characterList.length;
    console.dir(this.characterList);
    console.dir(this.characterCount);
  }

  async getCharacters() {
    for (let character of this.characterList) {
      let url =
        "https://lostark.game.onstove.com/Profile/Character/" +
        encodeURI(character);
      let html = await axios.get(url);
      let result = cheerio.load(html.data);
      let datas = result(
        "#expand-character-list > ul > li > span > button > span"
      );
      let characterNames = [];
      for (let data of datas) {
        let characterName = data.children[0]["data"];
        characterNames.push(characterName);
      }
      this.characterExpand.push(characterNames);
    }
  }

  async getCharactersDetail() {
    for (let i = 0; i < this.characterExpand.length; i += 1) {
      let subList = [];
      for (let j = 0; j < this.characterExpand[i].length; j += 1) {
        let url =
          "https://lostark.game.onstove.com/Profile/Character/" +
          encodeURI(this.characterExpand[i][j]);
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
          // 1370이상으로 필터링
          if (parseInt(characterLevel, 10) >= 1370) {
            subList.push([characterName, characterLevel]);
          }
        }
      }
      subList.sort(function (a, b) {
        return b[1] - a[1];
      });
      this.charactersDatail.push(subList);
    }
  }

  async deletesheet() {
    // 기존 포맷 전부 삭제 및 데이터 삭제
    //this.characterCount와 그 위의 레벨데이터를 지우기위해 강제로 + 1
    for (
      let i = this.rowCount + 1;
      i < this.rowCount + this.characterCount * 2 + 4;
      i += 1
    ) {
      //넉넉하게 오른쪽으로 20개까지 삭제하도록 설정
      for (let j = this.columnCount + 1; j < this.columnCount + 20; j += 1) {
        let currentCell = this.sheet.getCell(i, j);
        currentCell.clearAllFormatting();
        currentCell.backgroundColor = {
          red: 0.9372549,
          green: 0.9372549,
          blue: 0.9372549,
        };
      }
      for (let j = this.columnCount + 1; j < this.columnCount + 20; j += 1) {
        let currentCell = this.sheet.getCell(i, j);
        currentCell.value = "";
      }
    }
    await this.sheet.saveUpdatedCells();
  }

  async writeArray() {
    let row = this.rowCount + 1;
    let column = this.columnCount;
    let max = 1;
    let levelSection = [
      {
        level: "1490",
        backgroundColor: { red: 0.91764706, green: 0.6, blue: 0.6 },
      },
      {
        level: "1475",
        backgroundColor: { red: 0.8117647, green: 0.8862745, blue: 0.9529412 },
      },
      {
        level: "1460",
        backgroundColor: { red: 0.7882353, green: 0.85490197, blue: 0.972549 },
      },
      {
        level: "1445",
        backgroundColor: { red: 0.95686275, green: 0.8, blue: 0.8 },
      },
      {
        level: "1430",
        backgroundColor: { red: 0.9882353, green: 0.8980392, blue: 0.8039216 },
      },
      {
        level: "1415",
        backgroundColor: { red: 0.8509804, green: 0.8235294, blue: 0.9137255 },
      },
      {
        level: "1370",
        backgroundColor: { red: 0.8156863, green: 0.8784314, blue: 0.8901961 },
      },
    ];

    let isHalf = false;
    for (let i = 0; i < levelSection.length; i += 1) {
      if (!isHalf && i >= levelSection.length / 2) {
        row = this.rowCount + this.characterCount + 3;
        column = this.columnCount;
        max = 1;
        isHalf = true;
      }
      column += max;
      max = 1;
      let sectionCell = this.sheet.getCell(row, column);
      sectionCell.value = levelSection[i].level;
      sectionCell.backgroundColor = levelSection[i].backgroundColor;
      sectionCell.horizontalAlignment = "CENTER";
      // j는 사람
      for (let j = 0; j < this.charactersDatail.length; j += 1) {
        let width = 0;
        //k 는 캐릭터 갯수
        for (let k = 0; k < this.charactersDatail[j].length; ) {
          let currentCell = this.sheet.getCell(row + 1 + j, column + width);
          if (
            Number.parseInt(this.charactersDatail[j][k][1]) >=
            Number.parseInt(levelSection[i].level)
          ) {
            currentCell.value = String(this.charactersDatail[j][k][0]);
            currentCell.backgroundColor = levelSection[i].backgroundColor;
            currentCell.horizontalAlignment = "CENTER";
            this.charactersDatail[j].shift();
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
  }

  async run() {
    let carp = new Carp();
    await carp.loadSpreadSheet();
    await carp.findIndex();
    await carp.findCharacter();
    await carp.getCharacters();
    await carp.getCharactersDetail();
    await carp.deletesheet();
    await carp.writeArray();

    await carp.sheet.saveUpdatedCells();

    return "완료되었습니다.";
  }
}

module.exports = {
  Carp,
};
