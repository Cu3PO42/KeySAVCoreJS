"use strict";

class KeyStoreMemory {
    constructor() {
        this.saveKeys = {};
        this.bvKeys = {};
    }

    getSaveKey(stamp) {
        return Promise.resolve(this.saveKeys[stamp]);
    }

    getBvKey(stamp) {
        return Promise.resolve(this.bvKeys[stamp]);
    }

    getSaveKeySync(stamp) {
        return (this.saveKeys[stamp]);
    }

    getBvKeySync(stamp) {
        return (this.bvKeys[stamp]);
    }

    setSaveKey(key) {
        this.saveKeys[key.stamp] = key;
    }

    setBvKey(key) {
        this.bvKeys[key.stamp] = key;
    }
}

module.exports = { default: KeyStoreMemory };