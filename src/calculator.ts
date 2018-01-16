import * as expData from "../stats/expData.json";
import * as stats6 from "../stats/stats6.json";
import * as stats7 from "../stats/stats7.json";
import PkBase from "./pkbase";

/**
 * Calculate the level a given Pokémon has.
 *
 * @param pkm The Pokémon to calculate the level for.
 */
export function level(pkm: PkBase): number {
  let base = (pkm.version === 6 ? stats6 : stats7)[pkm.species - 1];
  let rate = base[Math.min(base.length - 1, pkm.form)].expGrowth;
  for (var level = 1; level <= 100 && pkm.exp >= expData.levels[level][rate]; ++level) {}
  return level - 1;
}

/**
 * Calculate the HP stat a given Pokémon has.
 *
 * @param pkm The Pokémon to calculate the HP stat for.
 */
export function hp(pkm: PkBase) {
  var base = (pkm.version === 6 ? stats6 : stats7)[pkm.species - 1];
  base = base[Math.min(base.length - 1, pkm.form)].baseStats;
  return (base.hp === 1 ? 1 : 0)
    ? 1
    : Math.floor((pkm.ivHp + 2 * base.hp + Math.floor(pkm.evHp / 4) + 100) * level(pkm) / 100) + 10;
}

/**
 * Calculate the attack stat a given Pokémon has.
 *
 * @param pkm The Pokémon to calculate the attack stat for.
 */
export function atk(pkm: PkBase) {
  var base = (pkm.version === 6 ? stats6 : stats7)[pkm.species - 1];
  base = base[Math.min(base.length - 1, pkm.form)].baseStats;
  return Math.floor(
    (Math.floor((pkm.ivAtk + 2 * base.atk + Math.floor(pkm.evAtk / 4)) * level(pkm) / 100) + 5) *
      (1 + 0.1 * (Math.floor(pkm.nature / 5) === 0 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 0 ? 1 : 0))
  );
}

/**
 * Calculate the defense stat a given Pokémon has.
 *
 * @param pkm The Pokémon to calculate the defense stat for.
 */
export function def(pkm: PkBase) {
  var base = (pkm.version === 6 ? stats6 : stats7)[pkm.species - 1];
  base = base[Math.min(base.length - 1, pkm.form)].baseStats;
  return Math.floor(
    (Math.floor((pkm.ivDef + 2 * base.def + Math.floor(pkm.evDef / 4)) * level(pkm) / 100) + 5) *
      (1 + 0.1 * (Math.floor(pkm.nature / 5) === 1 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 1 ? 1 : 0))
  );
}

/**
 * Calculate the special attack stat a given Pokémon has.
 *
 * @param pkm The Pokémon to calculate the special attack stat for.
 */
export function spAtk(pkm: PkBase) {
  var base = (pkm.version === 6 ? stats6 : stats7)[pkm.species - 1];
  base = base[Math.min(base.length - 1, pkm.form)].baseStats;
  return Math.floor(
    (Math.floor((pkm.ivSpAtk + 2 * base.spAtk + Math.floor(pkm.evSpAtk / 4)) * level(pkm) / 100) + 5) *
      (1 + 0.1 * (Math.floor(pkm.nature / 5) === 3 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 3 ? 1 : 0))
  );
}

/**
 * Calculate the special defense stat a given Pokémon has.
 *
 * @param pkm The Pokémon to calculate the special defense stat for.
 */
export function spDef(pkm: PkBase) {
  var base = (pkm.version === 6 ? stats6 : stats7)[pkm.species - 1];
  base = base[Math.min(base.length - 1, pkm.form)].baseStats;
  return Math.floor(
    (Math.floor((pkm.ivSpDef + 2 * base.spDef + Math.floor(pkm.evSpDef / 4)) * level(pkm) / 100) + 5) *
      (1 + 0.1 * (Math.floor(pkm.nature / 5) === 4 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 4 ? 1 : 0))
  );
}

/**
 * Calculate the speed stat a given Pokémon has.
 *
 * @param pkm The Pokémon to calculate the speed stat for.
 */
export function spe(pkm: PkBase) {
  var base = (pkm.version === 6 ? stats6 : stats7)[pkm.species - 1];
  base = base[Math.min(base.length - 1, pkm.form)].baseStats;
  return Math.floor(
    (Math.floor((pkm.ivSpe + 2 * base.spe + Math.floor(pkm.evSpe / 4)) * level(pkm) / 100) + 5) *
      (1 + 0.1 * (Math.floor(pkm.nature / 5) === 2 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 2 ? 1 : 0))
  );
}
