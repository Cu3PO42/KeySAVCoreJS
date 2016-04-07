var assert = require("assert");
var Pkx = require("../pkx").default;
var BattleVideoBreaker = require("../battle-video-breaker");
var fs = require("fs");
var KeyStoreMemory = require("./support/key-store-memory").default;
var setKeyStore = require("../key-store").setKeyStore;
var BattleVideoKey = require("../battle-video-key").default;
var BattleVideoReader = require("../battle-video-reader").default;

function bufferToUint8Array(buf) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

var video1 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059-1-2"));
var video2 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059-2-2"));
var video3 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059-1"));
var video4 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059-2"));
var video5 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059 (13)"));
var key = new BattleVideoKey(bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059-key.bin")));
var keyWithoutOpponent = new BattleVideoKey(bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059-key-without-opponent.bin")));
var crobat = new Pkx(bufferToUint8Array(fs.readFileSync(__dirname + "/data/crobat.pk6")), -1, 0, false);
var linoone = new Pkx(bufferToUint8Array(fs.readFileSync(__dirname + "/data/linoone.pk6")), -1, 0, false);

describe("BattleVideoBreaker", function() {
    describe("#breakKey()", function() {
        it("should break a battle video key without opponent key correctly", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            BattleVideoBreaker.breakKey(video3, video4).then(function(res) {
                assert.equal("CREATED_WITHOUT_OPPONENT", res);
                assert.deepEqual(store.getBvKeySync(keyWithoutOpponent.stamp), keyWithoutOpponent);
            });
        });

        it("should break a battle video key with opponent key correctly", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            BattleVideoBreaker.breakKey(video1, video2).then(function(res) {
                assert.equal("CREATED_WITH_OPPONENT", res);
                assert.deepEqual(store.getBvKeySync(key.stamp), key);
            });
        });

        it("should upgrade a battle video key without opponent key to one with opponent key", function() {
          var store = new KeyStoreMemory();
          setKeyStore(store);
          store.setBvKey(keyWithoutOpponent);
          BattleVideoBreaker.breakKey(video1, video2).then(function(res) {
            assert.equal("UPGRADED_WITH_OPPONENT", res);
            assert.deepEqual(store.getBvKeySync(key.stamp), key);
          });
        });
    });

    describe("#load()", function() {
        it("should get the key for a battle video from the store and create a BattleVideoReader", function() {
            var store = new KeyStoreMemory();
            store.setBvKey(key);
            setKeyStore(store);
            return BattleVideoBreaker.load(video1).then(function(reader) {
                assert.equal(reader instanceof BattleVideoReader, true);
            });
        });
    });
});

describe("BattleVideoReader", function() {
    describe("#getPkx()", function() {
        it("should fetch a pk6 from my team", function() {
            var reader = new BattleVideoReader(video5, key);
            assert.deepEqual(reader.getPkx(0), crobat);
        });

        it("should fetch a pk6 from my opponent's team", function() {
            var reader = new BattleVideoReader(video5, key);
            assert.deepEqual(reader.getPkx(0, true), linoone);
        });
    });
});
