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

const langs = ["de", "en", "es", "fr", "it", "ja", "ko", "zh"];
const ballToItem = [
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

/**
 * The localization of all proper names used for one language.
 */
export class LocalizationLanguage {
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
   * The names of all locations in the games, accessible by generation and IDs.
   */
  locations: { bw2: string[]; xy: string[]; sm: string[] };

  /**
   * The names of all ribbons in Gen 6 and 7 games by set and flag position.
   */
  ribbonNames: string[][];

  /**
   * The characteristics a Pokémon can have, by type and alternative.
   */
  characteristics: string[][];

  constructor(public lang: string, local: any) {
    Object.assign(this, local);
  }

  /**
   * Get the name of the location a Pokémon was caught.
   *
   * @param pkm The Pokémon whose met location to retrieve
   */
  getLocation(pkm: PkBase): string;

  /**
   * Get a location name from the given game version and location ID.
   *
   * @param originGame The version ID the Pokémon was caught in
   * @param location The location ID
   * @return The location name
   */
  getLocation(originGame: number, location: number): string;

  getLocation(originGame: number | PkBase, location?: number): string {
    if (location === undefined) {
      const pkm = originGame as PkBase;
      if (pkm.metLocation && pkm.gameVersion && pkm.eggLocation !== undefined) {
        location = pkm.metLocation;
        originGame = pkm.gameVersion;
      } else {
        return "";
      }
    }
    if (originGame < 24) {
      return this.locations.bw2[location];
    }
    if (originGame > 23) {
      return this.locations.xy[location];
    }
    if (originGame > 27) {
      return this.locations.sm[location];
    }
  }

  /**
   * Get the name of the egg location of a Pokémon.
   *
   * @param pkm The Pokémon whose egg location to check
   * @return The location name
   */
  getEggLocation(pkm: PkBase): string {
    if (pkm.eggLocation === undefined || pkm.gameVersion === undefined) return "";
    return this.getLocation(pkm.gameVersion, pkm.eggLocation);
  }

  /**
   * Get a list of the names of all ribbons a Pokémon has.
   *
   * @param pkm The Pokémon whose Ribbons to retrieve
   * @return The list of ribbons
   */
  getRibbons(pkm: PkBase): string[] {
    const res = [];

    for (let i = 0; i < 8; ++i) {
      const names = this.ribbonNames[i];
      let ribbonSet = pkm.ribbonData[i];

      for (let j = 0; ribbonSet > 0; ++j, ribbonSet >>= 1) {
        if (ribbonSet & 1 && names[j]) {
          res.push(names[j]);
        }
      }
    }

    return res;
  }

  /**
   * Get the name of the ball a Pokémon was captured in.
   *
   * @param pkm The Pokémon whose ball to check
   * @return The ball name
   */
  getBallName(ball: number): string {
    return this.items[ballToItem[ball]];
  }

  /**
   * Get the description text of the characteristic a Pokémon has.
   *
   * @param pkm The Pokémon whose characteristic to check
   * @return The characteristic description
   */
  getCharacteristic(pkm: PkBase): string {
    const ivs = [pkm.ivHp, pkm.ivAtk, pkm.ivDef, pkm.ivSpe, pkm.ivSpAtk, pkm.ivSpDef];
    const max = Math.max.apply(Math, ivs);
    const maxVals = ivs.map(iv => (iv === max ? max : undefined));

    for (let index = pkm.pid % 6; ; index = (index + 1) % 6) {
      if (maxVals[index] !== undefined) {
        return this.characteristics[index][max % 5];
      }
    }
  }
}

export default function loadLocalization(language: string) {
  if (langs.indexOf(language) === -1) return Promise.reject(new Error("Language not supported."));
  return import("../localization/" + language + "/").then(function(local) {
    return new LocalizationLanguage(language, local);
  });
}
