var assert = require("assert");
var KeyStoreMemory = require("./support/key-store-memory").default;
var Breaker = require("../breaker");
var setKeyStore = require("../key-store").setKeyStore;
var SaveKey = require("../save-key").default;
var BattleVideoKey = require("../battle-video-key").default;
var fs = require("fs");

function bufferToUint8Array(buf) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

var sav16 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/16.bin"));
var sav165 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/165.bin"));
var savKey = new SaveKey((fs.readFileSync(__dirname + "/data/oras-key-new.bin")));
var video1 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059-1-2"));
var video2 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059-2-2"));
var bvKey = new BattleVideoKey(bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059-key.bin")));

describe("Breaker", function() {
    describe("#breakSavOrBv()", function() {
        it("should create a key for two saves", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            return Breaker.breakSavOrBv(sav16, sav165).then(function(res) {
                assert.equal(res.success, true);
                assert.notEqual(store.getSaveKeySync(savKey.stamp), undefined);
            });
        });

        it("should create a key for two battle videos", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            return Breaker.breakSavOrBv(video1, video2).then(function(res) {
                assert.equal(res.success, true);
                assert.notEqual(store.getBvKeySync(bvKey.stamp), undefined);
            });
        });

        it("should throw an error if both files are not of the same type", function() {
            return Breaker.breakSavOrBv(sav16, video1).then(function(res) {
                assert(false, "This should throw.");
            }, function(e) {
                assert.equal(e.type, "NOT_SAME_FILE_TYPE");
                assert.equal(e.fileType1, "SAV");
                assert.equal(e.fileType2, "BV");
            });
        });
    });

    describe("#loadSavOrBv()", function() {
        it("should load a save file", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            store.setSaveKeyManually(savKey);
            return Breaker.loadSavOrBv(sav16).then(function(res) {
                assert.equal(res.type, "SAV");
                assert.notEqual(res.reader, undefined);
            });
        });

        it("should load a battle video", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            store.setBvKey(bvKey);
            return Breaker.loadSavOrBv(video1).then(function(res) {
                assert.equal(res.type, "BV");
                assert.notEqual(res.reader, undefined);
            });
        });
    });
});