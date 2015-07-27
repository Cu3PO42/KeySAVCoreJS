var core = require('./KeySAVCore');
var KeyStore = require('./KeyStore');

module.exports = {
    Core: core,
    Extensions: {
        KeyStore: KeyStore
    }
};
