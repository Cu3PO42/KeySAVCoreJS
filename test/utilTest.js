var assert = require("assert");
var util = require("../util");

describe("util", function() {
    describe("#copy()", function() {
        it("should copy data between Uint8Arrays", function() {
            var src = new Uint8Array(23);
            var dst = new Uint8Array(20);

            for (var i = 0; i < 23; ++i) {
                src[i] = i;
            }

            util.copy(src, 1, dst, 1, 20);
            for (var i = 0; i < 20; ++i) {
                assert.equal(i, dst[i]);
            }
        });
    });

    describe("#empty()", function() {
        it("should detect an empty array", function() {
            var src = new Uint8Array(17);

            assert.equal(util.empty(src, 2, 14), true);
        });

        it("should detec a non-empty array", function() {
            var src = new Uint8Array(12);
            src[5] = 10;
            assert.equal(util.empty(src), false);
        });
    });

    describe("#sequenceEqual()", function() {
        it("should detect two equal arrays", function() {
            var src = new Uint8Array(10);

            for (var i = 0; i < 23; ++i) {
                src[i] = i;
            }

            assert.equal(util.sequenceEqual(src, 0, src, 0, 5), true);
        });

        it("should detect two non-equal arrays", function() {
            var src = new Uint8Array(10);
            var dest = new Uint8Array(10);

            src[5] = 5;

            assert.equal(util.sequenceEqual(src, dest), false);
        });
    });

    describe("#xor()", function() {
        it("should xor two arrays together", function() {
            var src1 = new Uint8Array([1,2,3,4,5]);
            var src2 = new Uint8Array([2,3,4,5,6]);
            var res = new Uint8Array([3,1,7,1,3]);

            assert.deepEqual(util.xor(src1, src2), res);
        });
    });

    describe("#xorThree()", function() {
        it("should xor three arrays together", function() {
            var src1 = new Uint8Array([1,2,3,4,5]);
            var src2 = new Uint8Array([2,3,4,5,6]);
            var src3 = new Uint8Array([3,1,7,1,3]);

            var res = util.xorThree(src1, 0, src2, 0, src3, 0, 5);

            assert.deepEqual(res, new Uint8Array(5));
        });
    });

    describe("#xorInPlace()", function() {
        it("should xor two arrays and store the result in place", function() {
            var src1 = new Uint8Array([1,2,3,4,5]);
            var src2 = new Uint8Array([2,3,4,5,6]);
            var res = new Uint8Array([3,1,7,1,3]);

            util.xorInPlace(src1, 0, src2, 0, 5);

            assert.deepEqual(src1, res);
        });
    });

    describe("#pad4()", function() {
        it("should pad a number to 4 digits", function() {
           assert.equal(util.pad4(10), "0010");
        });

        it("should not pad a number with more than 4 digits", function() {
            assert.equal(util.pad4(10000), "10000");
        });
    });

    describe("#pad5()", function() {
        it("should pad a number to 5 digits", function() {
            assert.equal(util.pad5(10), "00010");
        });

        it("should not pad a number with more than 5 digits", function() {
            assert.equal(util.pad5(100000), "100000");
        });
    });

    describe("#decodeUnicode16LE()", function() {
        it("should decode a simple string", function() {
            var src = new Uint8Array([ 84, 0, 101, 0, 115, 0, 116, 0, 33, 0 ]);
            assert.equal(util.decodeUnicode16LE(src, 0, src.length), "Test!");
        });

        it("should decode GameFreak's private use symbols", function() {
            var src = new Uint8Array([149,224,150,224,151,224,152,224,153,224,144,224,146,224,147,224,145,224,148,224,154,224,155,224,156,224,157,224,158,224,61,216,16,222,61,216,10,222,61,216,43,222,61,216,36,222,61,216,164,220,163,224,164,224,142,224,143,224,141,224]);
            assert.equal(util.decodeUnicode16LE(src, 0, src.length), "⊙○□△♢♠♥♦♣★♪☀⛅☂⛄😐😊😫😤💤⤴⤵♂♀…")
        });

        it("should trim null bytes", function() {
            var src = new Uint8Array([ 84, 0, 101, 0, 115, 0, 116, 0, 33, 0, 0, 0, 0, 0, 0, 0 ]);
            assert.equal(util.decodeUnicode16LE(src, 0, src.length), "Test!");
        });
    });

    describe("#encodeUnicode16LE()", function() {
        it("should decode a simple string", function() {
            var src = new Uint8Array([ 84, 0, 101, 0, 115, 0, 116, 0, 33, 0 ]);
            assert.deepEqual(util.encodeUnicode16LE("Test!"), src);
        });

        it("should encode GameFreak's private use symbols", function() {
            var src = new Uint8Array([149,224,150,224,151,224,152,224,153,224,144,224,146,224,147,224,145,224,148,224,154,224,155,224,156,224,157,224,158,224,61,216,16,222,61,216,10,222,61,216,43,222,61,216,36,222,61,216,164,220,163,224,164,224,142,224,143,224,141,224]);
            assert.deepEqual(util.encodeUnicode16LE("⊙○□△♢♠♥♦♣★♪☀⛅☂⛄😐😊😫😤💤⤴⤵♂♀…"), src)
        });
    });

    describe("#createDataView()", function() {
        it("should create a data view on the same data as a Uint8Array", function() {
            var src = new Uint8Array(16).slice(8);
            src[0] = 1;
            src[7] = 2;

            var view = util.createDataView(src);
            assert.equal(view.getUint8(0), 1);
            assert.equal(view.getUint8(7), 2);
        });
    });

    describe("#createUint16Array()", function() {
        it("should create a Uint16Array on the same data as a Uint8Array", function() {
            var src = new Uint8Array(16).slice(8);
            src[0] = 1;
            src[7] = 2;

            var arr = util.createUint16Array(src);
            assert.equal(arr[0], 1);
            assert.equal(arr[3], 0x200);
        });
    });

    describe("#createUint32Array()", function() {
        it("should create a Uint32Array on the same data as a Uint8Array", function() {
            var src = new Uint8Array(16).slice(8);
            src[0] = 1;
            src[7] = 2;

            var arr = util.createUint32Array(src);
            assert.equal(arr[0], 1);
            assert.equal(arr[1], 0x2000000);
        });
    });
});
