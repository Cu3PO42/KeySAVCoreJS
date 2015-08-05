var fs = require("fs"),
    forms = require("./localization/forms.json"),
    names = {};

var langs = ["de", "en", "es", "fr", "it", "ja", "ko"];
var files = ["abilities", "countries", "forms", "games", "items", "languageTags", "moves", "natures", "regions", "species", "types"];

for (var i = 0; i < langs.length; ++i) {
    var lang = names[langs[i]] = {};
    for (var j = 0; j < files.length; ++j) {
        lang[files[j]] = fs.readFileSync(__dirname + "/localization/" + langs[i] + "/" + files[j] + ".txt", {encoding: "utf-8"}).split("\n");
    }
    lang.forms = forms[langs[i]];
}

module.exports = names;
