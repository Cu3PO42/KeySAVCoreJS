var core = require('./KeySAVCore');
var KeyStore = require('./KeyStore');
var Localization = require("./Localization")
var calculateLevel = require("./level")

module.exports = {
    Core: core,
    Extensions: {
        KeyStore: KeyStore,
        Localization: Localization,
        calculateLevel: calculateLevel
    }
};
