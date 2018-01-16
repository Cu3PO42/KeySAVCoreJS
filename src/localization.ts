import * as forms6 from "../localization/forms6.json";
import * as forms7 from "../localization/forms7.json";
import * as locations from "../localization/locations.json";
import * as characteristics from "../localization/characteristics.json";
import * as ribbons from "../localization/ribbons.json";
import * as abilities from "../localization/abilities.json";
import * as items from "../localization/items.json";
import * as species from "../localization/species.json";
import * as moves from "../localization/moves.json";
import * as games from "../localization/games.json";
import * as types from "../localization/types.json";
import * as natures from "../localization/natures.json";
import * as countries from "../localization/countries.json";
import * as languageTags from "../localization/languageTags.json";
import * as regions from "../localization/regions.json";
import PkBase from "./pkbase";

var langs = ["de", "en", "es", "fr", "it", "ja", "ko", "zh"];

/**
 * The localization of all proper names used for one language.
 */
export interface LocalizationLanguage {
  /**
   * The names of all abilities accessible by their ID.
   */
  abilities: string[];

  /**
   * The list of all countries a 3DS can be set to.
   */
  countries: string[];

  /**
   * The list of all form names in generation 6, accessible by species, then form ID.
   */
  forms6: string[][];

  /**
   * The list of all form names in generation 7, accessible by species, then form ID.
   */
  forms7: string[][];

  /**
   * The names of the games, accessible by their ID.
   */
  games: string[];

  /**
   * The name of all items, accessible by their ID.
   */
  items: string[];

  /**
   * All language tags, accessible by their ID.
   */
  languageTags: string[];

  /**
   * The names of all moves, accessible by their ID.
   */
  moves: string[];

  /**
   * The names of all natures, accessible by their IDs.
   */
  natures: string[];

  /**
   * The names of all regions a Pokémon can be from, accessible by their IDs.
   */
  regions: string[];

  /**
   * The names of all species, accessible by their IDs.
   */
  species: string[];

  /**
   * The names of all types, accessible by their IDs.
   */
  types: string[];

  /**
   * Get the name of the location a Pokémon was caught.
   *
   * @param pkm The Pokémon whose met location to retrieve
   */
  getLocation(pkm: PkBase): string;

  /**
   * Get a location name from the given game version and location ID.
   *
   * @param gameVersion The version ID the Pokémon was caught in
   * @param location The location ID
   * @return The location name
   */
  getLocation(gameVersion: number, location: number): string;

  /**
   * Get the name of the egg location of a Pokémon.
   *
   * @param pkm The Pokémon whose egg location to check
   * @return The location name
   */
  getEggLocation(pkm: PkBase): string;

  /**
   * Get a list of the names of all ribbons a Pokémon has.
   *
   * @param pkm The Pokémon whose Ribbons to retrieve
   * @return The list of ribbons
   */
  getRibbons(pkm: PkBase): string[];

  /**
   * Get the name of the ball a Pokémon was captured in.
   *
   * @param pkm The Pokémon whose ball to check
   * @return The ball name
   */
  getBallName(ball: number): string;

  /**
   * Get the description text of the characteristic a Pokémon has.
   *
   * @param pkm The Pokémon whose characteristic to check
   * @return The characteristic description
   */
  getCharacteristic(pkm: PkBase): string;
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
  var lang = (names[langs[i]] = <any>{});

  lang.forms6 = forms6[langs[i]];
  lang.forms7 = forms7[langs[i]];
  lang.abilities = abilities[langs[i]];
  lang.items = items[langs[i]];
  lang.moves = moves[langs[i]];
  lang.species = species[langs[i]];
  lang.moves = moves[langs[i]];
  lang.games = games[langs[i]];
  lang.types = types[langs[i]];
  lang.natures = natures[langs[i]];
  lang.countries = countries[langs[i]];
  lang.languageTags = languageTags[langs[i]];
  lang.regions = regions[langs[i]];

  lang.getLocation = (function(lang) {
    return function(originGame, location) {
      if (location === undefined) {
        if (originGame.metLocation && originGame.gameVersion && originGame.eggLocation !== undefined) {
          location = originGame.metLocation;
          originGame = originGame.gameVersion;
        } else {
          return "";
        }
      }
      if (originGame < 24) {
        return locations[lang].bw2[location];
      }
      if (originGame > 23) {
        return locations[lang].xy[location];
      }
      if (originGame > 27) {
        return locations[lang].sm[location];
      }
    };
  })(langs[i]);

  lang.getEggLocation = (function(lang) {
    return function(pkm) {
      if (pkm.eggLocation === undefined || pkm.gameVersion === undefined) return "";
      return lang.getLocation(pkm.gameVersion, pkm.eggLocation);
    };
  })(lang);

  lang.getRibbons = (function(lang) {
    var ribbonNames = ribbons[lang];
    return function(pkx) {
      var res = [];

      for (var i = 0; i < 8; ++i) {
        var names = ribbonNames[i];
        var ribbonSet = pkx.ribbonData[i];

        for (var j = 0; ribbonSet > 0; ++j, ribbonSet >>= 1) {
          if (ribbonSet & 1 && names[j]) {
            res.push(names[j]);
          }
        }
      }

      return res;
    };
  })(langs[i]);

  lang.getBallName = (function(lang) {
    return function(ball) {
      var ballToItem = [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        492,
        493,
        494,
        495,
        496,
        497,
        498,
        499,
        576,
        851,
      ];

      return lang.items[ballToItem[ball]];
    };
  })(lang);

  lang.getCharacteristic = (function(lang) {
    return function(pkx: PkBase) {
      const ivs = [pkx.ivHp, pkx.ivAtk, pkx.ivDef, pkx.ivSpe, pkx.ivSpAtk, pkx.ivSpDef];
      const max = Math.max.apply(Math, ivs);
      const maxVals = ivs.map(iv => (iv === max ? max : undefined));

      for (let index = pkx.pid % 6; ; index = (index + 1) % 6) {
        if (maxVals[index] !== undefined) {
          return characteristics[lang][index][max % 5];
        }
      }
    };
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
