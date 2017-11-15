const stats = require('../stats7.json');
const forms = require('../localization/forms7.json');
const species = require ('../localization/species.json').en;

function findMissingFormsByLang(forms) {
    for (let i = 0; i < stats.length; ++i) {
        for (let j = 1; j < stats[i].length; ++j) {
            if (!forms[i + 1] || forms[i + 1][j] === undefined)
                console.log(`${i+1} (${species[i+1]})#${j}`);
        }
    }
}

function findAllMissingForms() {
    for (const lang of Object.keys(forms)) {
        console.log(`Finding missing forms in lang ${lang}`);
        findMissingFormsByLang(forms[lang]);
    }
}

if (!module.parent) {
    findAllMissingForms();
}
