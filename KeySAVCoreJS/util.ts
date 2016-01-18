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
    var tmp = new Buffer(str, "ucs2"), res = [];
    for (var i = 0; i < tmp.length; ++i) {
        res.push(tmp.readUInt8(i));
    }
    return res;
}

export function copy(src, off1, dest, off2, len) {
    // TODO IMPLEMENT
}
