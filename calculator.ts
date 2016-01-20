/// <reference path="typings/node/node.d.ts"/>
var expData = require("./expData.json");
var stats = require("./stats.json")
import Pkx from "./pkx";

export function level(pkm): number {
    var rate = expData.species[pkm.species-1];
    for (var level = 1; pkm.exp >= expData.levels[level][rate]; ++level) {}
    return level - 1;
}

export function hp(pkm: Pkx) {
    var base = stats[pkm.species-1];
    base = base[Math.min(base.length-1, pkm.form)].baseStats;
    return (base.hp === 1 ? 1 : 0) ? 1 : Math.floor(((pkm.ivHp + (2 * base.hp) + Math.floor(pkm.evHp / 4) + 100) * level(pkm)) / 100) + 10;
}

export function atk(pkm: Pkx) {
    var base = stats[pkm.species-1];
    base = base[Math.min(base.length-1, pkm.form)].baseStats;
    return Math.floor((Math.floor(((pkm.ivAtk + (2 * base.atk) + Math.floor(pkm.evAtk / 4)) * level(pkm)) / 100) + 5) * (1 + 0.1 * (Math.floor(pkm.nature / 5) === 0 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 0 ? 1 : 0)));
}

export function def(pkm: Pkx) {
    var base = stats[pkm.species-1];
    base = base[Math.min(base.length-1, pkm.form)].baseStats;
    return Math.floor((Math.floor(((pkm.ivDef + (2 * base.def) + Math.floor(pkm.evDef / 4)) * level(pkm)) / 100) + 5) * (1 + 0.1 * (Math.floor(pkm.nature / 5) === 1 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 1 ? 1 : 0)));
}

export function spAtk(pkm: Pkx) {
    var base = stats[pkm.species-1];
    base = base[Math.min(base.length-1, pkm.form)].baseStats;
    return Math.floor((Math.floor(((pkm.ivSpAtk + (2 * base.spAtk) + Math.floor(pkm.evSpAtk / 4)) * level(pkm)) / 100) + 5) * (1 + 0.1 * (Math.floor(pkm.nature / 5) === 3 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 3 ? 1 : 0)));
}

export function spDef(pkm: Pkx) {
    var base = stats[pkm.species-1];
    base = base[Math.min(base.length-1, pkm.form)].baseStats;
    return Math.floor((Math.floor(((pkm.ivSpDef + (2 * base.spDef) + Math.floor(pkm.evSpDef / 4)) * level(pkm)) / 100) + 5) * (1 + 0.1 * (Math.floor(pkm.nature / 5) === 4 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 4 ? 1 : 0)));
}

export function spe(pkm: Pkx) {
    var base = stats[pkm.species-1];
    base = base[Math.min(base.length-1, pkm.form)].baseStats;
    return Math.floor((Math.floor(((pkm.ivSpe + (2 * base.spe) + Math.floor(pkm.evSpe / 4)) * level(pkm)) / 100) + 5) * (1 + 0.1 * (Math.floor(pkm.nature / 5) === 2 ? 1 : 0) - 0.1 * (pkm.nature % 5 === 2 ? 1 : 0)));
}