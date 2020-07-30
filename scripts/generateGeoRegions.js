const path = require('path');
const fs = require('fs');

const languages = ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'zh'];
const pkhexPath = process.argv[2];
const textPath = path.join(pkhexPath, 'PKHeX.Core', 'Resources', 'text');
const localPath = path.join(__dirname, '..', 'localization');

function importRegions () {
  const data = fs.readFileSync(path.join(textPath,'locale','languages.txt'),'utf16le').split(/\r?\n/);
  var langData = [];
  data.forEach(function(element, index) {
    if (index != 0){
      langData.push(element.split(',')[1]);
    }
  });
  console.log(langData);
  for (const lang of languages) {
    fs.writeFileSync(path.join(localPath, lang, 'geoRegion' + '.json'), JSON.stringify(langData, null, 4), 'utf16le');
  }
}

importRegions();