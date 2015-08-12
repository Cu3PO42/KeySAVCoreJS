var expData = require("./expData.json");

module.exports = function(species, exp) {
    var rate = expData.species[species];
    for (var level = 1; exp >= expData.levels[level][rate]; ++level) {}
    return level-1;
}
