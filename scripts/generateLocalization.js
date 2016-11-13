const path = require('path');
const fs = require('fs');

const languages = ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'zh'];
const pkhexPath = process.argv[2];
const textPath = path.join(pkhexPath, 'PKHeX', 'Resources', 'text');
const localPath = path.join(__dirname, '..', 'localization');

function generateBase(sourceName, destName) {
    const data = {};
    for (const lang of languages) {
        data[lang] = fs.readFileSync(path.join(textPath, lang, `text_${sourceName}_${lang}.txt`), 'utf-8').split(/\r?\n/);
    }
    fs.writeFileSync(path.join(localPath, destName + '.json'), JSON.stringify(data, null, 4), 'utf-8');
}

function generateSpecies() {
    generateBase('Species', 'species');
}

function generateItems() {
    generateBase('Items', 'items');
}

function generateAbilities() {
    generateBase('Abilities', 'abilities');
}

function generateMoves() {
    generateBase('Moves', 'moves');
}

function generateNatures() {
    generateBase('Natures', 'natures');
}

function generateTypes() {
    generateBase('Types', 'types');
}

function generateGames() {
    generateBase('Games', 'games');
}

function generateAll() {
    generateSpecies();
    generateItems();
    generateAbilities();
    generateMoves();
    generateNatures();
    generateTypes();
    generateGames();
}

if (!module.parent) {
    generateAll();
}
