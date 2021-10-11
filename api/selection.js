const axios = require("axios");

async function createSelection(name, author, params) {
  let requestBody = {
    name,
    author,
    type: params.type
  };
  try {
    let result = await axios.post("http://localhost:3000/selection", params);
    // console.log(result.data);
    return result.data;
  } catch (e) {
    console.log(e);
  }
}

async function getSelection(params) {
  try {
    let result = await axios.get(`http://localhost:3000/selection/${params.type}`);
    // console.log(result);
    return result.data;
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  createSelection,
  getSelection
};