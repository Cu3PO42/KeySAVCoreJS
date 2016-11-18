function trimCString(str: string) {
    var index = str.indexOf('\0');
    if (index < 0)
        return str;
    return str.substr(0, index);
}

var specialCharMap: { [char: string]: string } = {
    "\ue095": "⊙",
    "\ue096": "○",
    "\ue097": "□",
    "\ue098": "△",
    "\ue099": "♢",
    "\ue090": "♠",
    "\ue092": "♥",
    "\ue093": "♦",
    "\ue091": "♣",
    "\ue094": "★",
    "\ue09a": "♪",
    "\ue09b": "☀",
    "\ue09c": "⛅",
    "\ue09d": "☂",
    "\ue09e": "⛄",
    "\ue09f": "😐",
    "\ue0a0": "😊",
    "\ue0a1": "😫",
    "\ue0a2": "😤",
    "\ue0a5": "💤",
    "\ue0a3": "⤴",
    "\ue0a4": "⤵",
    "\ue08e": "♂",
    "\ue08f": "♀",
    "\ue08d": "…"
};

var specialCharMapReverse: { [char: string]: string } = {};

for (let key in specialCharMap) {
    if (specialCharMap.hasOwnProperty(key)) {
        specialCharMapReverse[specialCharMap[key]] = key;
    }
}

export function decodeUnicode16LE(arr: Uint8Array, offset: number, length: number) {
    var buf = new Buffer(arr.buffer).slice(offset + arr.byteOffset, offset + arr.byteOffset + length);
    return trimCString(buf.toString("ucs2").replace(/./g, function(m) {
        return specialCharMap[m] || m;
    }));
}

export function encodeUnicode16LE(str: string) {
    var tmp = new Buffer(str.replace(/./g, function(m) {
        return specialCharMapReverse[m] || m;
    }), "ucs2");
    return new Uint8Array(tmp.buffer, tmp.byteOffset, tmp.byteLength);
}

export function createDataView(arr): DataView {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}

export function createBuffer(arr: Uint8Array | Uint16Array |  Uint32Array): Buffer {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
}

export function createUint8Array(arr): Uint8Array {
    return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}

export function createUint16Array(arr): Uint16Array {
    if ((arr.byteLength & 1) !== 0)
        throw new Error("Array not aligned to 2-byte words.");
    return new Uint16Array(arr.buffer, arr.byteOffset, arr.byteLength >> 1);
}

export function createUint32Array(arr): Uint32Array {
    if ((arr.byteLength & 3) !== 0)
        throw new Error("Array not aligned to 4-byte words.");
    return new Uint32Array(arr.buffer, arr.byteOffset, arr.byteLength >> 2);
}

export function copy(src: Uint8Array, off1: number, dest: Uint8Array, off2: number, length: number) {
    var totalOffset1 = off1 + src.byteOffset;
    var totalOffset2 = off2 + dest.byteOffset;
    var lower4Bound = Math.min(-totalOffset1 & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (((totalOffset1 - totalOffset2) & 3) !== 0 || lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            dest[i + off2] = src[i + off1];
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            dest[i + off2] = src[i + off1];
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var src_32 = new Uint32Array(src.buffer, totalOffset1 + lower4Bound, intermediate4Length);
        var dest_32 = new Uint32Array(dest.buffer, totalOffset2 + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            dest_32[i] = src_32[i];
        }
        for (var i = upper4Bound; i < length; ++i) {
            dest[i + off2] = src[i + off1];
        }
    }
}

export function xor(src1: Uint8Array, src2: Uint8Array): Uint8Array;
export function xor(src1: Uint8Array, src2: Uint8Array, length: number): Uint8Array;
export function xor(src1: Uint8Array, off1: number, src2: Uint8Array, off2: number, len: number): Uint8Array;
export function xor(src1: Uint8Array, off1: number, src2: Uint8Array, off2: number, dest: Uint8Array, off3: number, len: number): void;
export function xor(src1: Uint8Array, b, c?, d?, e?, f?, g?): any {
    var off1: number, src2: Uint8Array, off2: number, length: number, dest: Uint8Array, off3: number;
    if (b instanceof Uint8Array) {
        src2 = b;
        off1 = 0;
        if (Number.isInteger(c)) {
            off2 = c;
        } else {
            off2 = 0;
        }
        length = src1.length;
        dest = new Uint8Array(length);
        off3 = 0;
    } else {
        off1 = b;
        src2 = c;
        off2 = d;
        if (e instanceof Uint8Array) {
            dest = e;
            off3 = f;
            length = g;
        } else {
            length = e;
            dest = new Uint8Array(length);
            off3 = 0;
        }
    }

    var totalOffset1 = off1 + src1.byteOffset;
    var totalOffset2 = off2 + src2.byteOffset;
    var totalOffset3 = off3 + dest.byteOffset;
    var lower4Bound = Math.min(-totalOffset1 & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (((totalOffset1 - totalOffset2) & 3) !== 0 ||
        ((totalOffset1 - totalOffset3) & 3) !== 0 || lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            dest[i+off3] = src1[i+off1] ^ src2[i+off2];
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            dest[i+off3] = src1[i+off1] ^ src2[i+off2];
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var src1_32 = new Uint32Array(src1.buffer, totalOffset1 + lower4Bound, intermediate4Length);
        var src2_32 = new Uint32Array(src2.buffer, totalOffset2 + lower4Bound, intermediate4Length);
        var dest_32 = new Uint32Array(dest.buffer, totalOffset3 + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            dest_32[i] = src1_32[i] ^ src2_32[i];
        }
        for (var i = upper4Bound; i < length; ++i) {
            dest[i+off3] = src1[i+off1] ^ src2[i+off2];
        }
    }

    if (g === undefined)
        return dest;
}

export function xorThree(src1: Uint8Array, off1: number, src2: Uint8Array, off2: number, src3: Uint8Array, off3: number, length: number): Uint8Array {
    var totalOffset1 = off1 + src1.byteOffset;
    var totalOffset2 = off2 + src2.byteOffset;
    var totalOffset3 = off3 + src3.byteOffset;
    var lower4Bound = Math.min(-totalOffset1 & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (((totalOffset1 - totalOffset2) & 3) !== 0 ||
        ((totalOffset1 - totalOffset3) & 3) !== 0 || lower4Bound >= upper4Bound) {
        var dest = new Uint8Array(length);
        for (var i = 0; i < length; ++i) {
            dest[i] = src1[i+off1] ^ src2[i+off2] ^ src3[i+off3];
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            dest[i] = src1[i+off1] ^ src2[i+off2] ^ src3[i+off3];
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var dest = new Uint8Array(length + lower4Bound).subarray(lower4Bound); // do this so the destination array is on the same 4-byte alignment
        var src1_32 = new Uint32Array(src1.buffer, totalOffset1 + lower4Bound, intermediate4Length);
        var src2_32 = new Uint32Array(src2.buffer, totalOffset2 + lower4Bound, intermediate4Length);
        var src3_32 = new Uint32Array(src3.buffer, totalOffset3 + lower4Bound, intermediate4Length);
        var dest_32 = new Uint32Array(dest.buffer, dest.byteOffset + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            dest_32[i] = src1_32[i+off1] ^ src2_32[i+off2] ^ src3_32[i+off3];
        }
        for (var i = lower4Bound; i < length; ++i) {
            dest[i] = src1[i+off1] ^ src2[i+off2] ^ src3[i+off3];
        }
    }
    return dest;
}

export function xorInPlace(dest: Uint8Array, off1: number, src: Uint8Array, off2: number, length: number): void {
    var totalOffset1 = off1 + dest.byteOffset;
    var totalOffset2 = off2 + src.byteOffset;
    var lower4Bound = Math.min(-totalOffset1 & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (((totalOffset1 - totalOffset2) & 3) !== 0 || lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            dest[i + off1] ^= src[i + off2];
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            dest[i + off1] ^= src[i + off2];
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var dest_32 = new Uint32Array(dest.buffer, totalOffset1 + lower4Bound, intermediate4Length);
        var src_32 = new Uint32Array(src.buffer, totalOffset2 + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            dest_32[i] ^= src_32[i];
        }
        for (var i = upper4Bound; i < length; ++i) {
            dest[i + off1] ^= src[i + off2];
        }
    }
}

export function empty(src: Uint8Array, offset: number, length: number): boolean;
export function empty(src: Uint8Array): boolean;
export function empty(src: Uint8Array, offset?: number, length?: number): boolean {
    if (!Number.isInteger(offset) || !Number.isInteger(length)) {
        offset = 0;
        length = src.length;
    }
    var totalOffset = offset + src.byteOffset;
    var lower4Bound = Math.min(-totalOffset & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            if (src[i+offset] != 0)
                return false;
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            if (src[i+offset] != 0)
                return false;
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var src_32 = new Uint32Array(src.buffer, totalOffset + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            if (src_32[i] != 0)
                return false;
        }
        for (var i = upper4Bound; i < length; ++i) {
            if (src[i+offset] != 0)
                return false;
        }
    }
    return true;
}

export function sequenceEqual(src1: Uint8Array, src2: Uint8Array): boolean;
export function sequenceEqual(src1: Uint8Array, src2: Uint8Array, offset: number): boolean;
export function sequenceEqual(src1: Uint8Array, off1: number, src2: Uint8Array, off2: number, length: number): boolean;
export function sequenceEqual(src1: Uint8Array, b, c?, d?, e?): boolean {
    var off1: number, src2: Uint8Array, off2: number, length: number;
    if (b instanceof Uint8Array) {
        src2 = b;
        off1 = 0;
        if (Number.isInteger(c)) {
            off2 = c;
        } else {
            off2 = 0;
        }
        length = src1.length;
    } else {
        off1 = b;
        src2 = c;
        off2 = d;
        length = e;
    }
    var totalOffset1 = off1 + src1.byteOffset;
    var totalOffset2 = off2 + src2.byteOffset;
    var lower4Bound = Math.min(-totalOffset1 & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (((totalOffset1 - totalOffset2) & 3) !== 0 || lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            if (src1[i+off1] != src2[i+off2])
                return false;
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            if (src1[i+off1] != src2[i+off2])
                return false;
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var src1_32 = new Uint32Array(src1.buffer, totalOffset1 + lower4Bound, intermediate4Length);
        var src2_32 = new Uint32Array(src2.buffer, totalOffset2 + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            if (src1_32[i] != src2_32[i])
                return false;
        }
        for (var i = upper4Bound; i < length; ++i) {
            if (src1[i+off1] != src2[i+off2])
                return false;
        }
    }
    return true;
}

export function promisify<T>(fn: (cb: (err: Error, res: T) => void) => void): () => Promise<T>;
export function promisify<T, A1>(fn: (arg1: A1, cb: (err: Error, res: T) => void) => void): (arg1: A1) => Promise<T>;
export function promisify<T, A1, A2>(fn: (arg1: A1, arg2: A2, cb: (err: Error, res: T) => void) => void): (arg1: A1, arg2: A2) => Promise<T>;
export function promisify<T, A1, A2, A3>(fn: (arg1: A1, arg2: A2, arg3: A3, cb: (err: Error, res: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3) => Promise<T>;
export function promisify<T, A1, A2, A3, A4>(fn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, cb: (err: Error, res: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Promise<T>;
export function promisify<T, A1, A2, A3, A4, A5>(fn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, cb: (err: Error, res: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Promise<T>;
export function promisify<T, A1, A2, A3, A4, A5, A6>(fn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, cb: (err: Error, res: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6) => Promise<T>;
export function promisify<T, A1, A2, A3, A4, A5, A6, A7>(fn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7, cb: (err: Error, res: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7) => Promise<T>;
export function promisify(fn: Function) {
    return function(...args: any[]) {
        return new Promise(function(resolve, reject) {
            fn(...args, function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    };
}

export function pad4(n: number) {
    return n < 10000 ? ("0000" + n).slice(-4) : `${n}`;
}

export function pad5(n: number) {
    return n < 100000 ? ("00000" + n).slice(-5) : `${n}`;
}

export function base64Encode(arr: Uint8Array) {
    if (typeof Buffer !== "undefined") {
        return createBuffer(arr).toString("base64");
    }
    return btoa(String.fromCharCode(...arr));
}

export function getStampSav(arr: Uint8Array, off: number): string {
    return base64Encode(arr.subarray(off, off+8));
}

export function getStampBv(arr: Uint8Array, off: number): string {
    return base64Encode(arr.subarray(off, off+0x10));
}
