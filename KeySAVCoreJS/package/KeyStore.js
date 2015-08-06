var Promise = require('bluebird');
var fs = require('fs');
var Lazy = require('./lazy-value');
var KeySAVCore = require('./KeySAVCore');
var join = require('path').join;

var readdirAsync = Promise.promisify(fs.readdir),
    statAsync = Promise.promisify(fs.stat),
    openAsync = Promise.promisify(fs.open),
    readAsync = Promise.promisify(fs.read),
    writeAsync = Promise.promisify(fs.write),
    closeAsync = Promise.promisify(fs.close);

module.exports = (function() {
    function KeyStore(path) {
        this._keys = {};
        this._path = path;
        this._scan = this.scanSaveDirectory(path);
    }

    KeyStore.prototype.scanSaveDirectory = function(path) {
        var self = this;
        return readdirAsync(path)
        .map(function(fileName) {
            return statAsync(join(path, fileName))
            .then(function (stats) {
                if (stats.size === 0xB4AD4 || stats.size === 0x1000) {
                    return openAsync(join(path, fileName), 'r+')
                    .then(function(fd) {
                        var buf = new Buffer(8);
                        return readAsync(fd, buf, 0, 8, 0)
                        .then(function() {
                            var stamp = buf.toString('hex');
                            if (self._keys[stamp] === undefined) {
                                self._keys[stamp] = {fd: fd, name: fileName, isSav: stats.size === 0xB4AD4, key: new Lazy(function(cb) {
                                    var buf = new Buffer(stats.size);
                                    readAsync(fd, buf, 0, stats.size, 0)
                                    .then(function() {
                                        var arr = new Uint8Array(stats.size);
                                        for (var i = 0; i < stats.size; ++i)
                                            arr[i] = buf.readUInt8(i);
                                        var key = stats.size === 0xB4AD4 ? new KeySAVCore.Structures.SaveKey.ctor$1(arr) : arr;
                                        cb(null, key);
                                    })
                                    .catch(cb);
                                })};
                            }
                        });
                    });
                }
            });
        });
    }

    KeyStore.prototype._getKey = function(stamp1, stamp2, callback, isSav) {
        var buf = new Buffer(8);
        buf.writeUInt32LE(stamp1, 0);
        buf.writeUInt32LE(stamp2, 4);
        var stamp = buf.toString('hex');
        if (this._keys[stamp] !== undefined) {
            if (this._keys[stamp].isSav === isSav) {
                this._keys[stamp].key.get(callback);
            } else {
                callback("No key found.");
            }
        } else {
            var self = this;
            (this._scan.isFulfilled() ? (this._scan = this.scanSaveDirectory(this._path)) : this._scan)
            .then(function() {
                if (self._keys[stamp] !== undefined && self._keys[stamp].isSav === isSav) {
                    self._keys[stamp].key.get(callback);
                } else {
                    callback("No key found.");
                }
            })
        }
    }

    KeyStore.prototype.getSaveKey = function(stamp1, stamp2, callback) {
        this._getKey(stamp1, stamp2, callback, true);
    }

    KeyStore.prototype.getBvKey = function(stamp1, stamp2, callback) {
        this._getKey(stamp1, stamp2, callback, false);
    }

    KeyStore.prototype.close = function() {
        var promises = [];
        for (var key in this._keys) {
            var lazyKey = this._keys[key];
            if (lazyKey.isSav && lazyKey.key.isInitialized()) {
                var buf = new Buffer(lazyKey.key.getSync().keyData);
                writeAsync(lazyKey.fd, buf, 0, buf.length, 0)
                .then(function() {
                    fs.close(lazyKey.fd);
                });
            }
        }
    }

    KeyStore.prototype.setKey = function(name, data, key) {
        var buf = new Buffer(data);
        var stamp = buf.toString('hex', 0, 8);

        var self = this;
        function writeFile(fd) {
            writeAsync(fd, buf, 0, buf.length, 0);
            if (data.length === 0xB4AD4) {
                if (key === undefined) {
                    key = new KeySAV.Core.Structures.SaveKey.ctor$1(data)
                }
                self._keys[stamp] = {fd: fd, name: name, isSav: true, key: new Lazy(function(cb) {
                    cb(null, key);
                })};
            } else {
                self._keys[stamp] = {fd: fd, name: name, isSav: false, key: new Lazy(function(cb) {
                    cb(null, data);
                })};
            }
        }

        if (this._keys[stamp] !== undefined) {
            closeAsync(this._keys[stamp].fd)
            .then(function() { return openAsync(name, 'w+'); })
            .then(writeFile);
        } else {
            openAsync(name, 'w+')
            .then(writeFile);
        }
    }

    return KeyStore;
})();
