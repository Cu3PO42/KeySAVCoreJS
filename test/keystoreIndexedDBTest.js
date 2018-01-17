var assert = require("assert");
var KeyStoreIndexedDB = require("../lib/key-store-indexeddb").default;
var SaveKey = require("../lib/save-key").default;
var BattleVideoKey = require("../lib/battle-video-key").default;
var fs = require("fs");

global.indexedDB = require('fake-indexeddb');

function bufferToUint8Array(buf) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}
var savKey = new SaveKey(bufferToUint8Array(fs.readFileSync(__dirname + "/data/oras-key-new.bin")));
var bvKey = new BattleVideoKey(bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000003-key-with-opponent.bin")));

describe("KeyStoreIndexedDB", function() {
    describe("#setKey()", function () {
        it("should not fail", function() {
            const store = new KeyStoreIndexedDB();
            return store.setSaveKey(savKey);
        });
    });

    describe("#getKey()", function() {
        it("should return a key previously set", function() {
            let store = new KeyStoreIndexedDB();
            return store.setSaveKey(savKey).then(function () {
                store = new KeyStoreIndexedDB();
                return store.getSaveKey(savKey.stamp);
            }).then(function (newKey) {
                assert.deepEqual(savKey, newKey);
            });
        });
    });

    describe("#persistKey()", function() {
        it("should write modifications to a key to the database", function() {
            let store = new KeyStoreIndexedDB();
            let prevVal;
            return store.setSaveKey(savKey).then(function () {
                prevVal = savKey.boxKey1[42];
                savKey.boxKey1[42] = 42;
                return savKey.persist();
            }).then(function () {
                store = new KeyStoreIndexedDB();
                return store.getSaveKey(savKey.stamp);
            }).then(function (newKey) {
                assert.deepEqual(savKey, newKey);
                savKey.boxKey1[42] = prevVal;
            });
        });
    })
});