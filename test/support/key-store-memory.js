"use strict";

var assert = require("assert");

class KeyStoreMemory {
    constructor() {
        this.saveKeys = {};
        this.bvKeys = {};
    }

    getSaveKey(stamp) {
        if (this.saveKeys[stamp] !== undefined)
            return Promise.resolve(this.saveKeys[stamp]);
        return Promise.reject({ name: "NoKeyAvailableError" });
    }

    getBvKey(stamp) {
        if (this.bvKeys[stamp] !== undefined)
            return Promise.resolve(this.bvKeys[stamp]);
        return Promise.reject({ name: "NoKeyAvailableError" });
    }

    getSaveKeySync(stamp) {
        return (this.saveKeys[stamp]);
    }

    getBvKeySync(stamp) {
        return (this.bvKeys[stamp]);
    }

    setSaveKeyManually(key) {
        this.saveKeys[key.stamp] = key;
    }

    setSaveKey(key, pkx) {
        assert.notEqual(pkx, undefined, "Should get a Pkx when setting a save key.");
        this.saveKeys[key.stamp] = key;
    }

    setBvKey(key) {
        this.bvKeys[key.stamp] = key;
    }
}

module.exports = { default: KeyStoreMemory };