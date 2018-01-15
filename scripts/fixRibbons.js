// Script used for fixing ribbon names at e5a176416a1f6f7d3598086cb8e924762b70269
const fs = require('fs');

const ribbons = require('../localization/ribbons');
const langs = ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko'];

function fixLang(lang) {
  const data = ribbons[lang];
  let all = [];
  for (let i = 0; i < 4; ++i) all.push(...data[i]);
  all = all.map(s => (s ? s.trim() : s));
  const res = [];
  for (let i = 0; i < all.length; i += 8) res.push(all.slice(i, i + 8));
  res.push([null, null, null, null, null, null, null, null]);
  res.push([null, null, null, null, null, null, null, null]);
  return res;
}

function fixAll() {
  const res = {};
  for (const lang of langs) {
    res[lang] = fixLang(lang);
  }
  fs.writeFileSync('../localization/ribbons.json', JSON.stringify(res, null, 4), 'utf-8');
}

if (!module.parent) {
  fixAll();
}
