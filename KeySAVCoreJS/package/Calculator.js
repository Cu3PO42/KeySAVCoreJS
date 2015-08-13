var expData = require("./expData.json");
var stats = require("./stats.json")

module.exports = {
    level: function(species, exp) {
        var rate = expData.species[species];
        for (var level = 1; exp >= expData.levels[level][rate]; ++level) {}
        return level-1;
    },
    hp: function(pkm) {
        var base = stats[pkm.species];
        base = base[Math.min(base.length, pkm.form)].baseStats;
        return (base.hp === 1) ? 1 : Math.floor(((pkm.ivHp + (2 * base.hp) + Math.floor(pkm.evHp / 4) + 100) * pkm.level) / 100) + 10;
    },
    atk: function(pkm) {
        var base = stats[pkm.species];
        base = base[Math.min(base.length, pkm.form)].baseStats;
        return Math.floor(((pkm.ivAtk + (2 * base.atk) + Math.floor(pkm.evAtk / 4)) * pkm.level) / 100) + 5;
    },
    def: function(pkm) {
        var base = stats[pkm.species];
        base = base[Math.min(base.length, pkm.form)].baseStats;
        return Math.floor(((pkm.ivDef + (2 * base.def) + Math.floor(pkm.evDef / 4)) * pkm.level) / 100) + 5;
    },
    spAtk: function(pkm) {
        var base = stats[pkm.species];
        base = base[Math.min(base.length, pkm.form)].baseStats;
        return Math.floor(((pkm.ivSpAtk + (2 * base.spAtk) + Math.floor(pkm.evSpAtk / 4)) * pkm.level) / 100) + 5;
    },
    spDef: function(pkm) {
        var base = stats[pkm.species];
        base = base[Math.min(base.length, pkm.form)].baseStats;
        return Math.floor(((pkm.ivSpDef + (2 * base.spDef) + Math.floor(pkm.evSpDef / 4)) * pkm.level) / 100) + 5;
    },
    spe: function(pkm) {
        var base = stats[pkm.species];
        base = base[Math.min(base.length, pkm.form)].baseStats;
        return Math.floor(((pkm.ivSpe + (2 * base.spe) + Math.floor(pkm.evSpe / 4)) * pkm.level) / 100) + 5;
    }
}
