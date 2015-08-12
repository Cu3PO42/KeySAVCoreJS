var core = require('./KeySAVCore');
var KeyStore = require('./KeyStore');
var Localization = require("./Localization")

module.exports = {
    Core: core,
    Extensions: {
        KeyStore: KeyStore,
        Localization: Localization
    }
};
