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
    // TODO POSSIBLY FIX
    return new DataView(arr.buffer);
}

export function copy(src, off1, dest, off2, len) {
    // TODO IMPLEMENT
}

export function xor(src1: Uint8Array, src2: Uint8Array): Uint8Array;
export function xor(src1: Uint8Array, src2: Uint8Array, length: number): Uint8Array;
export function xor(src1: Uint8Array, off1: number, src2: Uint8Array, off2: number, len: number): Uint8Array;
export function xor(src1: Uint8Array, off1: number, src2: Uint8Array, off2: number, dest: Uint8Array, off3: number, len: number): void;
export function xor(a, b, c?, d?, e?, f?, g?): any {
    // TODO IMPLEMENT
}

export function xorInPlace(dest: Uint8Array, off1: number, src: Uint8Array, off2: number, len: number): void {
    // TODO IMPLEMENT
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
export function sequenceEqual(a, b, c?, d?, e?): boolean {
    return true;
    // TODO IMPLEMENT
}

export function pad4(n: number) {
    return ("0000" + n).slice(-4);
}

export function getStamp(arr: Uint8Array, off: number): string;
export function getStamp(buf: ArrayBuffer, off: number): string;
export function getStamp(el: any, off: number): string {
    // TODO IMPLEMENT
}