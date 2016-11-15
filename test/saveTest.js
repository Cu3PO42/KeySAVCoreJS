var assert = require("assert");
var SaveReaderDecrypted = require("../save-reader-decrypted").default;
var SaveReaderEncrypted = require("../save-reader-encrypted").default;
var SaveBreaker = require("../save-breaker");
var PkBase = require("../pkbase").default;
var Pk6 = require("../pk6").default;
var fs = require("fs");
var KeyStoreMemory = require("./support/key-store-memory").default;
var setKeyStore = require("../key-store").setKeyStore;
var SaveKey = require("../save-key").default;
var util = require("../util");

function bufferToUint8Array(buf) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function keyEqual(key1, key2) {
    assert.equal(key2.slot1Flag, key1.slot1Flag);
    assert.equal(key2.stamp, key1.stamp);
    assert.equal(key2.boxOffset, key1.boxOffset);
    assert.equal(util.sequenceEqual(key2.blank, key1.blank), true);
    assert.equal(util.sequenceEqual(key2.slot1Key, key1.slot1Key), true);
    var zeros = new Uint8Array(232);
    var validSlots = [zeros, PkBase.encrypt(zeros), keyNew.blank];
    var key11 = util.createUint32Array(key1.boxKey1);
    var key12 = util.createUint32Array(key1.boxKey2);
    var key21 = util.createUint32Array(key2.boxKey1);
    var key22 = util.createUint32Array(key2.boxKey2);
    var slot = new Uint8Array(232);
    var slot32 = util.createUint32Array(slot);
    for (var i = 0; i < 930; ++i) {
        for (var j = 0; j < 232/4; ++j) slot32[j] = key11[j+232/4*i]^key12[j+232/4*i]^key21[j+232/4*i]^key22[j+232/4*i];
        assert.equal(validSlots.some((e) => util.sequenceEqual(e, slot)) || util.empty(key2.boxKey1, i * 232, 232), true, `Key slot ${i} not equal!`);
    }
}

var main = bufferToUint8Array(fs.readFileSync(__dirname + "/data/main"));
var mudkip = bufferToUint8Array(fs.readFileSync(__dirname + "/data/mudkip.pk6"));
var sav16 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/16.bin"));
var sav165 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/165.bin"));
var sav26 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/26.bin"));
var savFull1 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/full-1.bin"));
var savFull2 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/full-2.bin"));
var sav16SM = bufferToUint8Array(fs.readFileSync(__dirname + "/data/16-sm.sav"));
var sav165SM = bufferToUint8Array(fs.readFileSync(__dirname + "/data/165-sm.sav"));
var keyNew = new SaveKey((fs.readFileSync(__dirname + "/data/oras-key-new.bin")));
var keyOld = new SaveKey((fs.readFileSync(__dirname + "/data/oras-key-old.bin")));

describe("SaveReaderDecrypted", function() {
    describe("#getPkx()", function() {
        it("should get a Pk6 from a raw save file", function() {
            var reader = new SaveReaderDecrypted(main, "ORAS");
            assert.deepEqual(reader.getPkx(3), new Pk6(mudkip, 0, 3, false));
        });
    });
});

describe("SaveBreaker", function() {
    describe("#load()", function() {
        it("should load a decrypted file by creating a SaveReaderDecrypted", function() {
            return SaveBreaker.load(main).then(function(reader) {
                assert.equal(reader instanceof SaveReaderDecrypted, true);
            });
        });

        it("should load an encrypted save by creating a SaveReaderEncrypted", function() {
            var store = new KeyStoreMemory();
            store.setSaveKeyManually(keyNew);
            setKeyStore(store);
            return SaveBreaker.load(sav16).then(function(reader) {
                assert.equal(reader instanceof SaveReaderEncrypted, true);
            });
        });
    });

    describe("#breakKey()", function() {
        it("should create a new style key from two appropriate saves (Gen 6)", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            return SaveBreaker.breakKey(sav16, sav165).then(function(res) {
                assert.equal("CREATED_NEW", res);
                var key2 = store.getSaveKeySync(keyNew.stamp);
                keyEqual(keyNew, key2);
            });
        });

        it("should create an old style key from two appropriate saves (Gen 6)", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            return SaveBreaker.breakKey(sav16, sav26).then(function(res) {
                assert.equal("CREATED_OLD", res);
                var key2 = store.getSaveKeySync(keyOld.stamp);
                keyEqual(keyOld, key2);
            });
        });

        it("should create an old style key if the saves are in the reverse order (Gen 6)", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            return SaveBreaker.breakKey(sav26, sav16).then(function(res) {
                assert.equal("CREATED_OLD", res);
                var key2 = store.getSaveKeySync(keyOld.stamp);
                keyEqual(keyOld, key2);
            });
        });

        it("should upgrade an old style key to a new style key (Gen 6)", function () {
            var store = new KeyStoreMemory();
            store.setSaveKeyManually(new SaveKey(new Uint8Array(keyOld.keyData)));
            setKeyStore(store);
            return SaveBreaker.breakKey(sav16, sav165).then(function(res) {
                assert.equal("UPGRADED", res);
                var key2 = store.getSaveKeySync(keyNew.stamp);
                keyEqual(keyNew, key2);
            });
        });

        it("should break a key that can be used to dump the first six slots (Gen 6)", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            return SaveBreaker.breakKey(sav16, sav165).then(function(res) {
                return SaveBreaker.load(sav16);
            }).then(function(reader) {
                for (var i = 0; i < 6; ++i) {
                    assert.notEqual(reader.getPkx(i), undefined, `Box 1 slot ${i + 1} should be dumpable.`);
                }
                for (i = 30; i < 36; ++i) {
                    assert.equal(reader.getPkx(i), undefined, `Box 2 slot ${i - 29} should be empty.`);
                }
                return SaveBreaker.load(sav165);
            }).then(function(reader) {
                for (var i = 0; i < 6; ++i) {
                    assert.equal(reader.getPkx(i), undefined, `Box 1 slot ${i + 1} should be empty.`);
                }
                for (i = 30; i < 36; ++i) {
                    assert.notEqual(reader.getPkx(i), undefined, `Box 2 slot ${i - 29} should be dumpable.`);
                }
                return SaveBreaker.load(sav165);
            });
        });

        it("should throw an error if a key already exists", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            store.setSaveKeyManually(keyNew);
            return SaveBreaker.breakKey(sav16, sav165).then(function(res) {
                assert.fail(0, 1, "This should have thrown.");
            }, function() {});
        });
    });
});

describe("SaveReaderEncrypted", function() {
    describe("#getPkx()", function() {
        it("should dump a Pokémon from a save with a new-style key", function() {
            var reader = new SaveReaderEncrypted(sav16, keyNew);
            var pkx = reader.getPkx(0);
            assert.notEqual(pkx, undefined);
            assert.equal(pkx.species, 262);
        });

        it("should dump a Pokémon from a save with an old-style key", function() {
            var reader = new SaveReaderEncrypted(sav16, keyOld);
            var pkx = reader.getPkx(0);
            assert.notEqual(pkx, undefined);
            assert.equal(pkx.species, 262);
        });

        it("should update the keys with new data", function () {
            var key = new SaveKey(new Uint8Array(keyNew.keyData));
            var reader = new SaveReaderEncrypted(savFull1, key); reader.scanSlots();
            reader = new SaveReaderEncrypted(savFull2, key); reader.scanSlots();

            var slotsUnlocked = key.slotsUnlocked;
            for (var i = 0; i < 12 * 30; ++i) {
                assert.equal(slotsUnlocked[i], true, `Slot ${i + 1} should be unlocked.`);
                assert.equal(reader.getPkx(i).isGhost, false, `Slot ${i + 1} should have the key completed.`);
            }
        });

        it("should dump new slots as they are unlocked", function() {
            var key = new SaveKey(new Uint8Array(keyNew.keyData));
            var reader = new SaveReaderEncrypted(savFull1, key);

            for (var i = 0; i < 6; ++i) {
                const pkx = reader.getPkx(i);
                assert.notEqual(pkx, undefined, `Slot ${i + 1} should be dumpable.`);
                assert.equal(pkx.isGhost, false, `Slot ${i + 1} should not be a ghost.`);
            }
            for (var i = 6; i < 30; ++i) {
                const pkx = reader.getPkx(i);
                assert.notEqual(pkx, undefined, `Slot ${i + 1} should be dumpable.`);
                assert.equal(pkx.isGhost, true, `Slot ${i + 1} should be a ghost.`);
            }
            for (var i = 30; i < 6; ++i) {
                const pkx = reader.getPkx(i);
                assert.notEqual(pkx, undefined, `Slot ${i + 1} should be dumpable.`);
                assert.equal(pkx.isGhost, false, `Slot ${i + 1} should not be a ghost.`);
            }
            for (var i = 36; i < 12 * 30; ++i) {
                const pkx = reader.getPkx(i);
                assert.notEqual(pkx, undefined, `Slot ${i + 1} should be dumpable.`);
                assert.equal(pkx.isGhost, true, `Slot ${i + 1} should be a ghost.`);
            }
        });
    });

    describe("SaveKey", function() {
        it("should merge keys properly", function() {
            var store = new KeyStoreMemory();
            setKeyStore(store);
            var key1;
            var key2;
            return SaveBreaker.breakKey(sav16, sav165).then(function() {
                return SaveBreaker.load(savFull1);
            }).then(function(reader) {
                reader.scanSlots();
                key1 = store.getSaveKeySync(keyNew.stamp);
                store.saveKeys = {};
                return SaveBreaker.breakKey(sav16, sav165);
            }).then(function() {
                return SaveBreaker.load(savFull2);
            }).then(function(reader) {
                reader.scanSlots();
                key2 = store.getSaveKeySync(keyNew.stamp);
                key1.mergeKey(key2);
                var slotsUnlocked = key1.slotsUnlocked;
                for (var i = 0; i < 12 * 30; ++i) {
                  assert.equal(slotsUnlocked[i], true, `Slot ${i + 1} should be unlocked.`);
                }
            });
        });
    });
});
