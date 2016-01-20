"use strict";

export function trimCString(str: string) {
    var index = str.indexOf('\0');
    if (index < 0)
        return str;
    return str.substr(0, index);
}

export function decodeUnicode16LE(arr: number[]|Uint8Array, offset: number, length: number) {
    var buf = new Buffer(length);
    for (var i = 0; i < length; ++i) {
        buf.writeUInt8(arr[offset + i], i);
    }
    return buf.toString("ucs2");
}

export function encodeUnicode16LE(str: string) {
    // TODO Uint8Array?
    var tmp = new Buffer(str, "ucs2"), res = [];
    for (var i = 0; i < tmp.length; ++i) {
        res.push(tmp.readUInt8(i));
    }
    return res;
}

export function createDataView(arr): DataView {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}

export function copy<T>(src: ArrayLike<T>, off1: number, dest: ArrayLike<T>, off2: number, len: number) {
    for (var i = 0; i < len; ++i) {
        dest[i+off2] = src[i+off1];
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

    for (var i = 0; i < length; ++i) {
        dest[i+off3] = src1[i+off1] ^ src2[i+off2];
    }

    if (g === undefined)
        return dest;
}

export function xorInPlace(dest: Uint8Array, off1: number, src: Uint8Array, off2: number, len: number): void {
    for (var i = 0; i < len; ++i) {
        dest[i + off1] ^= src[i + off2];
    }
}

export function empty(src: ArrayLike<number>, offset: number, length: number): boolean;
export function empty(src: ArrayLike<number>): boolean;
export function empty(src: ArrayLike<number>, offset?: number, length?: number): boolean {
    if (!Number.isInteger(offset) || !Number.isInteger(length)) {
        offset = 0;
        length = src.length;
    }
    for (let i = offset; i < offset + length; ++i) {
        if (src[i] != 0) {
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
    for (var i = 0; i < length; ++i) {
        if (src1[i+off1] != src2[i+off2])
            return false;
    }
    return true;
}

export function pad4(n: number) {
    return ("0000" + n).slice(-4);
}

export function getStamp(arr: Uint8Array, off: number): string {
    return String.fromCharCode.apply(null, arr.subarray(off, off+8));
}
