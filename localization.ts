/// <reference path="typings/node/node.d.ts" />

"use strict";

import * as fs from "fs";
import Pkx from "./pkx";
var forms = require("./localization/forms.json"),
    locations = require("./localization/locations.json"),
    characteristics = require("./localization/characteristics.json"),
    ribbons = require("./localization/ribbons.json");

var langs = ["de", "en", "es", "fr", "it", "ja", "ko"];
var files = ["abilities", "countries", "forms", "games", "items", "languageTags", "moves", "natures", "regions", "species", "types"];


export interface LocalizationLanguage {
    abilities: string[];
    countries: string[];
    forms: string[][];
    games: string[];
    items: string[];
    languageTags: string[];
    moves: string[];
    natures: string[];
    regions: string[];
    species: string[];
    types: string[];

    getLocation(pkm: Pkx): string;
    getLocation(gameVersion: number, location: number): string;
    getEggLocation(pkm: Pkx): string;
    getRibbons(pkm: Pkx): string[];
    getBallName(ball: number): string;
    getCharacteristic(pkm: Pkx): string;
}

export interface Localization {
    de: LocalizationLanguage;
    en: LocalizationLanguage;
    es: LocalizationLanguage;
    fr: LocalizationLanguage;
    it: LocalizationLanguage;
    ja: LocalizationLanguage;
    ko: LocalizationLanguage;
    [lang: string]: LocalizationLanguage;
}

var names: Localization = <any>{};

for (var i = 0; i < langs.length; ++i) {
    var lang = names[langs[i]] = <any>{};

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
    })(lang);

    lang.getCharacteristic = (function(lang) {
        return function(pkx: Pkx) {
            const ivs = [pkx.ivHp, pkx.ivAtk, pkx.ivDef, pkx.ivSpe, pkx.ivSpAtk, pkx.ivSpDef];
            const max = Math.max.apply(Math, ivs);
            const maxVals = ivs.map(iv => iv === max ? max : undefined);

            for (let index = pkx.pid % 6;; index = (index + 1) % 6) {
                if (maxVals[index] !== undefined) {
                    return characteristics[lang][index][max % 5];
                }
            }
        }
    })(langs[i]);
}

export var de = names["de"];
export var en = names["en"];
export var es = names["es"];
export var fr = names["fr"];
export var it = names["it"];
export var ja = names["ja"];
export var ko = names["ko"];
export default names;
