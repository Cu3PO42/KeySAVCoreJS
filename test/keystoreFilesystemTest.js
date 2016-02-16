var assert = require("assert");
var KeyStoreFileSystem = require("../key-store-filesystem").default;
var SaveKey = require("../save-key").default;
var BattleVideoKey = require("../battle-video-key").default;
var fs = require("fs-extra");
var util = require("../util");
var Pkx = require("../pkx").default;
var Promise = require("bluebird");

var mkdir = Promise.promisify(fs.mkdir),
    unlink = Promise.promisify(fs.unlink),
    copy = Promise.promisify(fs.copy),
    stat = Promise.promisify(fs.stat),
    rmdir = Promise.promisify(fs.rmdir);

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
    var validSlots = [zeros, Pkx.encrypt(zeros), key1.blank];
    var key11 = util.createUint32Array(key1.boxKey1);
    var key12 = util.createUint32Array(key1.boxKey2);
    var key21 = util.createUint32Array(key2.boxKey1);
    var key22 = util.createUint32Array(key2.boxKey2);
    var slot = new Uint8Array(232);
    var slot32 = util.createUint32Array(slot);
    for (var i = 0; i < 930; ++i) {
        for (var j = 0; j < 232/4; ++j) slot32[j] = key11[j]^key12[j]^key21[j]^key22[j];
        assert.equal(validSlots.some((e) => util.sequenceEqual(e, slot)) || util.empty(key2.boxKey1, i * 232, 232), true, `Key slot ${i} not equal!`);
    }
}

var savKey = new SaveKey(bufferToUint8Array(fs.readFileSync(__dirname + "/data/oras-key-new.bin")));
var bvKey = new BattleVideoKey(bufferToUint8Array(fs.readFileSync(__dirname + "/data/00000059-key.bin")));
var mudkip = new Pkx(bufferToUint8Array(fs.readFileSync(__dirname + "/data/mudkip.pk6")));

describe("KeyStoreFileSystem", function() {
    describe("#getSaveKey()", function() {
        it("should read a SaveKey from the disk", function () {
            var store = new KeyStoreFileSystem(__dirname + "/data");
            return store.getSaveKey(savKey.stamp).then(function(key2) {
                keyEqual(savKey, key2);
            });
        });

        it("should read a 0x80000 sized old style key and resize it to 0xB4AD4", function() {
            var store;
            return mkdir(__dirname + "/store").then(function() {
                return copy(__dirname + "/data/oras-key-old-small.bin", __dirname + "/store/key.bin");
            }).then(function() {
                store = new KeyStoreFileSystem(__dirname + "/store");
                return store.getSaveKey(savKey.stamp);
            }).then(function(key2) {
                return store.close();
            }).then(function() {
                return stat(__dirname + "/store/key.bin");
            }).then(function(stats) {
                assert.equal(stats.size, 0xB4AD4);
                return unlink(__dirname + "/store/key.bin");
            }).then(function() {
                return rmdir(__dirname + "/store");
            });
        });
    });

    describe("#getBvKey()", function() {
        it("should read a battle video key from the disk", function() {
            var store = new KeyStoreFileSystem(__dirname + "/data");
            return store.getBvKey(bvKey.stamp).then(function(key2) {
                assert.deepEqual(bvKey.keyData, key2.keyData);
            });
        });
    });

    describe("#setSaveKey()", function() {
        it("should persist a save key to the disk", function () {
            var store;
            var key = new SaveKey(new Uint8Array(savKey.keyData));
            return mkdir(__dirname + "/store").then(function () {
                store = new KeyStoreFileSystem(__dirname + "/store");
            }).then(function () {
                return store.setSaveKey(key, mudkip);
            }).then(function () {
                return store.getSaveKey(key.stamp);
            }).then(function(key) {
                key.slot1Flag = 0;
                return store.close();
            }).then(function () {
                store = new KeyStoreFileSystem(__dirname + "/store");
                return store.getSaveKey(key.stamp);
            }).then(function (key2) {
                assert.deepEqual(key.keyData, key2.keyData);
                return unlink(__dirname + "/store/SAV Key - Meth Fred Jr - (31101.35009) - TSV 3867.bin");
            }).then(function () {
                return rmdir(__dirname + "/store");
            });
        });
    });

    describe("#setBattleVideoKey()", function() {
        it("should persist a battle video key to the disk", function () {
            var store;
            var key = new BattleVideoKey(new Uint8Array(bvKey.keyData));
            return mkdir(__dirname + "/store").then(function () {
                store = new KeyStoreFileSystem(__dirname + "/store");
            }).then(function () {
                return store.setBvKey(key);
            }).then(function () {
                return store.close();
            }).then(function () {
                store = new KeyStoreFileSystem(__dirname + "/store");
                return store.getBvKey(key.stamp);
            }).then(function (key2) {
                assert.deepEqual(key.keyData, key2.keyData);
                return unlink(__dirname + "/store/BV Key - cz1pBoGdP5UPBzRWVBX01Q==.bin");
            }).then(function () {
                return rmdir(__dirname + "/store");
            });

        });
    });
});