import * as expData from "../stats/expData.json";
import PkBase from "./pkbase";
import { start } from "repl";

export type Stats = {
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    spe: number;
  },
  expGrowth: number;
}[][];

export interface StatsMap {
  [gen: number]: Stats;
}

/**
 * A class to calculate the stat values of Pokémon of a certain generation.
 */
export class Calculator {
  /**
   * Create a new Calculator for the given generations with the given stat base data.
   * 
   * @param stats The base stats for all Pokémon in the supported generations.
   */
  constructor(private stats: StatsMap) {}

  /**
   * Get the base stat date for a given Pokémon if its generation is supported. Throw an error otherwise.
   * 
   * @param pkm The Pokémon to get stats for 
   */
  private getStats(pkm: PkBase) {
    const genStats = this.stats[pkm.version];
    if (!genStats)
      throw new Error("This calculator is for a different generation of Pokémon.");
    const speciesStats = genStats[pkm.species-1];
    return speciesStats[Math.min(speciesStats.length - 1, pkm.form)];
  }

  /**
   * Calculate the level a given Pokémon has.
   *
   * @param pkm The Pokémon to calculate the level for.
   */
  level(pkm: PkBase): number {
    const rate = this.getStats(pkm).expGrowth;
    for (var level = 1; level <= 100 && pkm.exp >= expData.levels[level][rate]; ++level) {}
    return level - 1;
  }

  /**
   * Calculate the HP stat a given Pokémon has.
   *
   * @param pkm The Pokémon to calculate the HP stat for.
   */
  hp(pkm: PkBase) {
    const stats = this.getStats(pkm).baseStats;
    return stats.hp === 1 
      ? 1
      : Math.floor((pkm.ivHp + 2 * stats.hp + Math.floor(pkm.evHp / 4) + 100) * this.level(pkm) / 100) + 10;
  }

  /**
   * Calculate the attack stat a given Pokémon has.
   *
   * @param pkm The Pokémon to calculate the attack stat for.
   */
  atk(pkm: PkBase) {
    const base = this.getStats(pkm).baseStats;
    return Math.floor(
      (Math.floor((pkm.ivAtk + 2 * base.atk + Math.floor(pkm.evAtk / 4)) * this.level(pkm) / 100) + 5) *
        (1 + 0.1 * (Math.floor(pkm.nature / 5) === 0 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 0 ? 1 : 0))
    );
  }

  /**
   * Calculate the defense stat a given Pokémon has.
   *
   * @param pkm The Pokémon to calculate the defense stat for.
   */
  def(pkm: PkBase) {
    const base = this.getStats(pkm).baseStats;
    return Math.floor(
      (Math.floor((pkm.ivDef + 2 * base.def + Math.floor(pkm.evDef / 4)) * this.level(pkm) / 100) + 5) *
        (1 + 0.1 * (Math.floor(pkm.nature / 5) === 1 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 1 ? 1 : 0))
    );
  }

  /**
   * Calculate the special attack stat a given Pokémon has.
   *
   * @param pkm The Pokémon to calculate the special attack stat for.
   */
  spAtk(pkm: PkBase) {
    const base = this.getStats(pkm).baseStats;
    return Math.floor(
      (Math.floor((pkm.ivSpAtk + 2 * base.spAtk + Math.floor(pkm.evSpAtk / 4)) * this.level(pkm) / 100) + 5) *
        (1 + 0.1 * (Math.floor(pkm.nature / 5) === 3 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 3 ? 1 : 0))
    );
  }

  /**
   * Calculate the special defense stat a given Pokémon has.
   *
   * @param pkm The Pokémon to calculate the special defense stat for.
   */
  spDef(pkm: PkBase) {
    const base = this.getStats(pkm).baseStats;
    return Math.floor(
      (Math.floor((pkm.ivSpDef + 2 * base.spDef + Math.floor(pkm.evSpDef / 4)) * this.level(pkm) / 100) + 5) *
        (1 + 0.1 * (Math.floor(pkm.nature / 5) === 4 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 4 ? 1 : 0))
    );
  }

  /**
   * Calculate the speed stat a given Pokémon has.
   *
   * @param pkm The Pokémon to calculate the speed stat for.
   */
  spe(pkm: PkBase) {
    const base = this.getStats(pkm).baseStats;
    return Math.floor(
      (Math.floor((pkm.ivSpe + 2 * base.spe + Math.floor(pkm.evSpe / 4)) * this.level(pkm) / 100) + 5) *
        (1 + 0.1 * (Math.floor(pkm.nature / 5) === 2 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 2 ? 1 : 0))
    );
  }
}

export function loadGen6Stats() {
  return import("../stats/stats6.json").then(function (stats) {
    return new Calculator({ 6: stats });
  });
}

export function loadGen7Stats() {
  return import("../stats/stats7.json").then(function (stats) {
    return new Calculator({ 6: stats });
  });
}

export function loadAllStats() {
  return Promise.all([import("../stats/stats6.json"), import("../stats/stats7.json")]).then(function ([stats6, stats7]) {
    return new Calculator({ 6: stats6, 7: stats7 });
  })
}