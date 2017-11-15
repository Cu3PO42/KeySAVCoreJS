const fs = require('fs');
const path = require('path');

const forms = require('../localization/forms7.json');
const localPath = path.join(__dirname, '..', 'localization');
const pkhexPath = process.argv[2];
const textPath = path.join(pkhexPath, 'PKHeX.Core', 'Resources', 'text');

function fixTotemForms(forms, formList) {
    const totemForms = [
        20, // Raticate
        735, // Gumshoos
        746, // Wishiwashi
        758, // Salazzle
        754, // Lurantis
        738, // Vikavolt
        778, // Mimikyu
        784, // Kommo-o
        105, // Marowak
        752, // Araquanid
        777, // Togedemaru
        743, // Ribombee
    ];
    const alolanTotemForms = [
        20, // Raticate (Normal, Alolan, Totem)
        105, // Marowak (Normal, Alolan, Totem)
    ];

    for (const id of totemForms) {
        forms[id] = { 1: formList[1007] };
    }
    for (const id of alolanTotemForms) {
        forms[id] = { 1: formList[810], 2: `${formList[810]} ${formList[1007]}` };
    }
    forms[778] = {
        0: formList[778], // Disguised
        1: formList[1058], // Busted
        2: `${formList[778]} ${formList[1007]}`, // Large
        3: `${formList[1058]} ${formList[1007]}`, // Busted
    }
}

function fixNecromanza(forms, formList) {
    forms[800] = {
        1: formList[1065],
        2: formList[1066],
        3: formList[1067]
    };
}

function fixMinior(forms, formList) {
    forms[774] = {
        0: formList[774], // "R-Meteor", // Meteor Red
        1: formList[1045], // "O-Meteor", // Meteor Orange
        2: formList[1046], // "Y-Meteor", // Meteor Yellow
        3: formList[1047], // "G-Meteor", // Meteor Green
        4: formList[1048], // "B-Meteor", // Meteor Blue
        5: formList[1049], // "I-Meteor", // Meteor Indigo
        6: formList[1050], // "V-Meteor", // Meteor Violet
        7: formList[1051], // "R-Core", // Core Red
        8: formList[1052], // "O-Core", // Core Orange
        9: formList[1053], // "Y-Core", // Core Yellow
        10: formList[1054], // "G-Core", // Core Green
        11: formList[1055], // "B-Core", // Core Blue
        12: formList[1056], // "I-Core", // Core Indigo
        13: formList[1057], // "V-Core", // Core Violet
    }
}

function fixRockruff(forms, formList) {
    (forms[744] = forms[744] || {})[1] = formList[1064];
    forms[745][2] = formList[1064];
}

function fixPikachu(forms, formList) {
    forms[25][7] = formList[1063];
}

function fixGreninja(forms, formList) {
    forms[658][2] = formList[1012];
}

function fixZygarde(forms, formList) {
    forms[718][4] = '100%-C';
}

function fixAll() {
    for (const lang of Object.keys(forms)) {
        const formList = fs.readFileSync(path.join(textPath, lang, `text_Forms_${lang}.txt`), lang === 'de' ? 'utf-8' : 'ucs2').split(/\r?\n/);
        fixTotemForms(forms[lang], formList);
        fixNecromanza(forms[lang], formList);
        fixMinior(forms[lang], formList);
        fixRockruff(forms[lang], formList);
        fixPikachu(forms[lang], formList);
        fixGreninja(forms[lang], formList);
        fixZygarde(forms[lang], formList);
    }

    fs.writeFileSync(path.join(localPath, 'forms7.json'), JSON.stringify(forms, null, 4), 'utf-8');
}

if (!module.parent) {
    fixAll();
}