var fs = require("fs"),
    forms = require("./localization/forms.json"),
    locations = require("./localization/locations.json"),
    ribbons = require("./localization/ribbons.json"),
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
    })(langs[i]);

    lang.getRibbons = (function(lang) {
        var ribbonNames = ribbons[lang];
        return function(pkx) {
            var res = [];

            for (var i = 0; i < 4; ++i) {
                var names = ribbonNames[i];
                var ribbonSet = [pkx.ribbonSet1, pkx.ribbonSet2, pkx.ribbonSet3, pkx.ribbonSet4][i];

                for (var j = 0; ribbonSet > 0; ++j, ribbonSet >>= 1) {
                    if (ribbonSet & 1) {
                        res.push(names[j]);
                    }
                }
            }

            return res;
        }
    })(langs[i]);

    lang.getBallName = (function(lang) {
        return function(ball) {
            var ballToItem = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 492, 493, 494, 495, 496, 497, 498, 499, 576];

            return lang.items[ballToItem[ball]];
        };
    })(langs[i]);
}

module.exports = names;
