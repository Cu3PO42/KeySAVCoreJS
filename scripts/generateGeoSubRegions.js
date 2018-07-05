const path = require('path');
const fs = require('fs');

const languages = ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'zh'];
const pkhexPath = process.argv[2];
const textPath = path.join(pkhexPath, 'PKHeX.Core', 'Resources', 'text');
const localPath = path.join(__dirname, '..', 'localization');

function writeDataToFile (data, filename) {
  const sortedJSON = sortByKey(data,'Subregion ID'); // not needed but better safe than sorry
  const lastRegionID = sortedJSON[sortedJSON.length-1]["Subregion ID"];
  const arrayWithAllIDs = [];
  for (var i = 0; i <= lastRegionID; i++){
    const paddedI = i.toLocaleString('en', {minimumIntegerDigits:3,maximumFractionDigits:0,useGrouping:false});
    arrayWithAllIDs.push(sortedJSON.find(function(element){
      return element["Subregion ID"] === paddedI;
    }));
  }
  for (var lang of languages) {
    const dirPath = path.join(localPath, lang, 'subregions');
    if (!fs.existsSync(dirPath)){
      fs.mkdirSync(dirPath);
    }
    if (lang === 'ja') {lang = 'jp';}
    const elements = [];
    arrayWithAllIDs.forEach(function(element){    
      if (element){
        elements.push(element[lang.toUpperCase()]);
      }
      else {elements.push("")}
      fs.writeFileSync(path.join(dirPath,  filename + '.json'), JSON.stringify(elements, null, 4), 'utf-8');
    })
  }
}

function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key]; var y = b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}

function getDataFromFile (filename) {
  const arr = fs.readFileSync(path.join(textPath,'locale','sr_ID','sr_' + filename + '.txt'),'utf-8').split(/\r?\n/);
  const jsonObj = [];
  const headers = arr[0].split(',');
  for(var i = 1; i < arr.length; i++) {
    if (arr[i].charAt(arr[i].length - 1) === ',') {
      arr[i] = arr[i].substr(0,arr[i].length-1);
    }
    const data = arr[i].split(',');
    const obj = {};
    for(var j = 0; j < data.length; j++) {
      obj[headers[j]] = data[j];
    }
    jsonObj.push(obj);
  }
  JSON.stringify(jsonObj);
  return jsonObj;
}

function readFolder (folderPath) {
  const files = fs.readdirSync(folderPath);
  const fileIDs = [];
  files.forEach(function(element){
    fileIDs.push(element.substring(3,6));
  });
  //console.log(fileIDs);
  return fileIDs
}

function iterate (id){
  const dataFromFile = getDataFromFile(id);
  writeDataToFile(dataFromFile, id)
}


const fileIDs = readFolder(path.join(textPath, 'locale','sr_ID'));
fileIDs.forEach(function(element){
  iterate(element);
});


