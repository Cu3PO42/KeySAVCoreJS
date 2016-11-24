var assert = require("assert");
var Pk6 = require("../pk6").default;
var BattleVideoBreaker = require("../battle-video-breaker");
var fs = require("fs");
var KeyStoreMemory = require("./support/key-store-memory").default;
var setKeyStore = require("../key-store").setKeyStore;
var BattleVideoKey = require("../battle-video-key").default;
var BattleVideoReader = require("../battle-video-reader").default;
var util = require("../util");

function bufferToUint8Array(buf) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function keyEqual(key1, key2, withOpponent) {
  if (withOpponent === undefined) {
      withOpponent = true;
  }

  assert.equal(key1.stamp, key2.stamp, 'Key stamp not equal.');
  for (let j = 0; j < (withOpponent ? key1.teamKeys.length : 1); ++j) {
      for (let i = 0; i < 6; ++i) {
          assert.equal(util.sequenceEqual(key1.teamKeys[j], i * 260, key2.teamKeys[j], i * 260, 260), true, `Team ${j + 1} key slot ${i + 1} not equal.`);
      }
  }
}

var video1 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000003-1-o"));
var video2 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000003-2-o"));
var video3 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000003-1"));
var video4 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000003-2"));
var video5 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000003-1-sm"));
var video6 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000003-2-sm"));
var video7 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/-1"));
var video8 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/-2"));
var key = new BattleVideoKey(bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000003-key-with-opponent.bin")));
var keyWithoutOpponent = new BattleVideoKey(bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000003-key-without-opponent.bin")));
var honedge = new Pk6(bufferToUint8Array(fs.readFileSync(__dirname + "/data/honedge.pk6")), -1, 0, false);
var garchomp = new Pk6(bufferToUint8Array(fs.readFileSync(__dirname + "/data/garchomp.pk6")), -1, 0, false);

describe("BattleVideoBreaker", function() {
    describe("#breakKey()", function() {
        it("should break a battle video key without opponent key correctly (Gen 6)", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            return BattleVideoBreaker.breakKey(video3, video4).then(function(res) {
                assert.deepEqual({upgraded: undefined, workingKeys: [true, false]}, res);
                keyEqual(store.getBvKeySync(keyWithoutOpponent.stamp), keyWithoutOpponent);
            });
        });

        it("should break a battle video key with opponent key correctly (Gen 6)", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            return BattleVideoBreaker.breakKey(video1, video2).then(function(res) {
                assert.deepEqual({upgraded: undefined, workingKeys: [true, true]}, res);
                keyEqual(store.getBvKeySync(key.stamp), key);
            });
        });

        it("should upgrade a battle video key without opponent key to one with opponent key (Gen 6)", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            store.setBvKey(keyWithoutOpponent);
            keyEqual(key, keyWithoutOpponent, false);
            return BattleVideoBreaker.breakKey(video1, video2).then(function(res) {
                assert.deepEqual({upgraded: true, workingKeys: [true, true]}, res);
                keyEqual(store.getBvKeySync(key.stamp), key);
            });
        });

        it("should break the same key with and without opponent (Gen 6)", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            var keyWOpponent, keyWOOpponent;
            return BattleVideoBreaker.breakKey(video1, video2).then(function(res) {
                keyWOpponent = store.getBvKeySync("PxzkhbtT8A6r6OVTGroWzA==");
                store = new KeyStoreMemory();
                setKeyStore(store);
                return BattleVideoBreaker.breakKey(video3, video4);
            }).then(function(res) {
                keyWOOpponent = store.getBvKeySync("PxzkhbtT8A6r6OVTGroWzA==");
                //keyEqual(keyWOOpponent, keyWOpponent, false);
                var readerWO = new BattleVideoReader(video1, keyWOpponent);
                var readerWOO = new BattleVideoReader(video1, keyWOOpponent);
                assert.deepEqual(readerWO.getPkx(0, 0), readerWOO.getPkx(0, 0));
            });
        });

        it("should break a key without opponent (Gen 7)", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            return BattleVideoBreaker.breakKey(video7, video8);
        });

        it("should break a key with opponent (Gen 7)", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            return BattleVideoBreaker.breakKey(video5, video6).then(function(res) {
                assert.deepEqual({upgraded: undefined, workingKeys: [true, true, false, false]}, res)
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
            var reader = new BattleVideoReader(video1, key);
            assert.deepEqual(reader.getPkx(0, 0), honedge);
        });

        it("should fetch a pk6 from my opponent's team", function() {
            var reader = new BattleVideoReader(video1, key);
            assert.deepEqual(reader.getPkx(0, 1), garchomp);
        });
    });
});
