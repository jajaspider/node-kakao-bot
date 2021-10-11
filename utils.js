function getPercent() {
  return Math.floor(Math.random() * 101);
}

function getKeyByValue(object, value) {
  console.log(Object.keys(object).find(key => object[key] === value));
  console.log(Object.keys(object));
  // return Object.keys(object)[]
  // return Object.keys(object).find(key => object[key] === value);
}


module.exports = {
  getPercent,
  getKeyByValue
};