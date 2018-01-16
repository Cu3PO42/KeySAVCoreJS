// script used for language splitting of localization at 973d298ea41cd178249ab0c145322f3fda64f36a 
const fs = require('fs');
const path = require('path');

const langs = ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'zh'];
const localizationDir = path.join(__dirname, '..', 'localization');
const files = fs.readdirSync(path.join(__dirname, '..', 'localization')).filter(e => e.endsWith('json'));

const importer = 'module.exports = {\n  ' + files.map(p => path.basename(p, '.json')).map(p => `${p}: require("./${p}.json")`).join(',\n  ') + '\n};\n';

for (const lang of langs) {
    const langDir = path.join(localizationDir, lang);
    if (!fs.existsSync(langDir))
        fs.mkdirSync();
    fs.writeFileSync(path.join(langDir, 'index.js'), importer);    
}

for (const file of files) {
    const data = require(path.join(localizationDir, file));
    const type = path.basename(file, '.json');
    for (const lang of langs) {
        const langData = data[lang];
        fs.writeFileSync(path.join(localizationDir, lang, type) + '.json', JSON.stringify(langData, null, '    '));
    }
}