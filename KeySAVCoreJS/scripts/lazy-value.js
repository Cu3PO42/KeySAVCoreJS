module.exports = (function() {
    function Lazy(fn) {
        this._evaluated = 0;
        this._value = undefined;
        this._fn = fn;
    }

    Lazy.prototype.get = function(callback) {
        if (this._evaluated === 1) {
            callback(null, this._value);
        } else if (this._evaluated === -1) {
            callback(this._value, null);
        } else {
            var self = this;
            this._fn(function(err, value) {
                if (err !== null) {
                    self._evaluated = -1;
                    self._value = err;
                    callback(err);
                } else {
                    self._evaluated = 1;
                    self._value = value;
                    callback(null, value);
                }
            });
        }
    }

    Lazy.prototype.getSync = function() {
        if (this._evaluated !== 1)
            throw new Error("Can't access uninitialized value.");
        return this._value;
    }

    Lazy.prototype.isInitialized = function() {
        return this._evaluated === 1;
    }

    return Lazy;
})();
