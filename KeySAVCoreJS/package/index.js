var core = require('./KeySAVCore');
var KeyStore = require('./KeyStore');
var Localization = require("./Localization")
var Calculator = require("./Calculator")

module.exports = {
    Core: core,
    Extensions: {
        KeyStore: KeyStore,
        Localization: Localization,
        Calculator: Calculator
    }
};
