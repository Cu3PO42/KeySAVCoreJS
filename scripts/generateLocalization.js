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

function generateCharacteristics() {
    const data = {};
    for (const lang of languages) {
        const lines = fs.readFileSync(path.join(textPath, lang, `text_Character_${lang}.txt`), 'utf-8').split(/\r?\n/);
        const langData = [];
        for (let i = 0; i < lines.length; i += 5) {
            langData.push(lines.slice(i, i + 5));
        }
        data[lang] = langData;
    }
    fs.writeFileSync(path.join(localPath, 'characteristics.json'), JSON.stringify(data, null, 4), 'utf-8');
}

const languagesInLocale = ['ja', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ko'];

function generateCountries() {
    const lines = fs.readFileSync(path.join(textPath, 'locale', 'countries.txt'), 'ucs2').split(/\r?\n/).map(l => l.split(/,/)).slice(1);
    const res = {};
    for (let i = 0; i < languagesInLocale.length; ++i) {
        const lang = languagesInLocale[i];
        const langData = res[lang] = [];
        for (const line of lines) {
            langData[line[0]] = line[i + 1];
        }
    }
    fs.writeFileSync(path.join(localPath, 'countries.json'), JSON.stringify(res, null, 4), 'utf-8');
}

function arrToObj(arr, obj, offset) {
    if (!offset) offset = 0;
    return arr.reduce(function(o, v, i) {
        if (v !== '')
            o[i+offset] = v;
        return o;
    }, obj || {});
}

function readLocations(name, lang, obj, offset) {
    const lines = fs.readFileSync(path.join(textPath, lang, `text_${name}_${lang}.txt`), 'utf-8').split(/\r?\n/);
    return arrToObj(lines, obj, offset);
}

function generateLocations() {
    var res = {};
    for (const lang of languages) {
        const langData = res[lang] = {};

        /*langData.hgss = readLocations('hgss_00000', lang);
        readLocations('hgss_02000', lang, langData.hgss, 2000);
        readLocations('hgss_03000', lang, langData.hgss, 3000);*/

        langData.bw2 = readLocations('bw2_00000', lang);
        readLocations('bw2_30000', lang, langData.bw2, 30000+1);
        readLocations('bw2_40000', lang, langData.bw2, 40000+1);
        readLocations('bw2_60000', lang, langData.bw2, 60000+1);

        langData.xy = readLocations('xy_00000', lang);
        readLocations('xy_30000', lang, langData.xy, 30000+1);
        readLocations('xy_40000', lang, langData.xy, 40000+1);
        readLocations('xy_60000', lang, langData.xy, 60000+1);

        // I have no idea why this is neccessary, see PKHeX/PKHeX/Game/GameInfo.cs#Sanitize
        const sm0 = fs.readFileSync(path.join(textPath, lang, `text_sm_00000_${lang}.txt`), 'utf-8').split(/\r?\n/);
        const sm0Copy = sm0.slice(0);
        for (let i = 0; i < sm0.length; i += 2) {
          const nextLoc = sm0[i + 1];
          if (/\S/.test(nextLoc) && nextLoc.charAt(0) !== '[') {
            sm0Copy[i] += ` (${nextLoc})`;
          }
        }
        langData.sm = arrToObj(sm0Copy, {});
        readLocations('sm_30000', lang, langData.sm, 30000+1);
        readLocations('sm_40000', lang, langData.sm, 40000+1);
        readLocations('sm_60000', lang, langData.sm, 60000+1);
    }

    fs.writeFileSync(path.join(localPath, 'locations.json'), JSON.stringify(res, null, 4), 'utf-8');
}

function generateForms() {
    const pkmFile = fs.readFileSync(path.join(pkhexPath, 'PKHeX', 'PKM', 'PKX.cs'), 'utf-8');
    const startIndex = pkmFile.indexOf('public static string[] getFormList(int species, string[] t, string[] f, string[] g, int generation = 6)');
    const startOfCodeIndex = pkmFile.indexOf('{', startIndex);
    const endOfCodeIndex = pkmFile.indexOf('\n        }', startIndex);
    const functionCode = pkmFile.substring(startOfCodeIndex + 1, endOfCodeIndex);
    const patchedCode = functionCode
        .replace(/new\[\]/g, '')
        .replace(/^( {16}(?: {4})?(?: {4})?)\{/gm, '$1[')
        .replace(/^( {16}(?: {4})?(?: {4})?)\}/gm, '$1]')
        .replace('{""}', '[""]')
        .replace('Array.IndexOf(', '')
        .replace('], species) > -1', '].includes(species)')
        .replace(/return +\r?\n +\[/g, 'return [')
    const formGetter = new Function('species', 't', 'f', 'g', 'generation', patchedCode);

    const res = {};
    for (const lang of languages) {
        const langData = res[lang] = {};
        const types = fs.readFileSync(path.join(textPath, lang, `text_Types_${lang}.txt`), 'utf-8').split(/\r?\n/);
        const forms = fs.readFileSync(path.join(textPath, lang, `text_Forms_${lang}.txt`), 'ucs2').split(/\r?\n/);

        for (let i = 0; i < 804; ++i) {
            const formsForPkm = formGetter(i, types, forms, ['♂', '♀', '-'], 7);
            if (formsForPkm.length !== 1 || formsForPkm[0] !== '') {
              langData[i] = formsForPkm;
            }
        }
    }
    fs.writeFileSync(path.join(localPath, 'forms7.json'), JSON.stringify(res, null, 4), 'utf-8');
}

function migrateLegacy() {
    try {
        for (const file of fs.readdirSync(path.join(localPath, 'en'))) {
          const res = {};

          for (const lang of languages) {
            res[lang] = fs.readFileSync(path.join(localPath, lang, file), 'utf-8').split(/\r?\n/);
          }

          fs.writeFileSync(path.join(localPath, path.basename(file, '.txt') + '.json'), JSON.stringify(res, null, 4), 'utf-8');
        }
    } catch (e) {}
}

function generateAll() {
    migrateLegacy();
    generateSpecies();
    generateItems();
    generateAbilities();
    generateMoves();
    generateNatures();
    generateTypes();
    generateGames();
    generateCharacteristics();
    generateCountries();
    generateLocations();
    generateForms();
}

if (!module.parent) {
    generateAll();
}
