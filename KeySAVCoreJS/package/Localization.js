var fs = require("fs"),
    forms = require("./localization/forms.json"),
    locations = require("./localization/locations.json"),
    names = {};

var langs = ["de", "en", "es", "fr", "it", "ja", "ko"];
var files = ["abilities", "countries", "forms", "games", "items", "languageTags", "moves", "natures", "regions", "species", "types"];

for (var i = 0; i < langs.length; ++i) {
    var lang = names[langs[i]] = {};

    for (var j = 0; j < files.length; ++j) {
        lang[files[j]] = fs.readFileSync(__dirname + "/localization/" + langs[i] + "/" + files[j] + ".txt", {encoding: "utf-8"}).split("\n");
    }

    lang.forms = forms[langs[i]];

    lang.getLocation = (function(lang) {
        return function(originGame, location) {
            if (location === undefined) {
                if (originGame.metLocation && originGame.gameVersion && originGame.eggLocation !== undefined) {
                    location = originGame.metLocation;
                    originGame = originGame.gameVersion;
                }
                else {
                    return "";
                }
            }
            if (originGame < 13 && originGame > 6) {
                return locations[lang].hgss[location];
            }
            if (originGame < 24) {
                return locations[lang].bw2[location];
            }
            if (originGame > 23) {
                return locations[lang].xy[location];
            }
        };
    })(langs[i]);

    lang.getEggLocation = (function(lang) {
        return function(pkm) {
            if (pkm.eggLocation === undefined || pkm.gameVersion === undefined)
                return "";
            return lang.getLocation(pkm.gameVersion, pkm.eggLocation);
        }
    })(lang);
}

module.exports = names;
