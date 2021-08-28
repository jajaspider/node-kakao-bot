const axios = require("axios");

async function createSelection(name, author, type) {
  let params = { name, author, type };
  try {
    let result = await axios.post("http://localhost:3000/selection", params);
    // console.log(result.data);
    return result.data;
  } catch (e) {
    console.log(e);
  }
}

async function getSelection(type) {
  try {
    let result = await axios.get(`http://localhost:3000/selection/${type}`);
    // console.log(result);
    return result.data;
  } catch (e) {
    console.log(e);
  }
}

module.exports = { createSelection, getSelection };
