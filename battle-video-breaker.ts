"use strict";

import BattleVideoReader from "./battle-video-reader";
import { currentKeyStore } from "./key-store";
import * as util from "./util";
import Pkx from "./pkx";

export async function load(input: Uint8Array): Promise<BattleVideoReader> {
    var input32 = new Uint32Array(input.buffer);
    var key = await currentKeyStore.getBvKey(util.getStamp(input, 0x10));
    return new BattleVideoReader(input, key);
}

export interface BattleVideoBreakResult {
    success: boolean;
    result: string;
}

export function breakKey(video1: Uint8Array, video2: Uint8Array): BattleVideoBreakResult {
    var ezeros = Pkx.encrypt(new Uint8Array(260));
    var xorstream;
    var breakstream;
    var bvkey = new Uint8Array(0x1000);

    var result = "";

    // Old Exploit to ensure that the usage is correct
    // Validity Check to see what all is participating...

    breakstream = video1.subarray(0x4E18, 0x4E18 + 260 * 6);
    // XOR them together at party offset
    xorstream = util.xor(breakstream, 0, video2, 0x4E18, 260*6);

    // Retrieve EKX_1's data
    var ekx1 = util.xor(ezeros, 0, xorstream, 260, 260);

    // If old exploit does not properly decrypt slot1...
    var pkx = Pkx.decrypt(ekx1);
    if (!Pkx.verifyChk(pkx))
    {
        return { success: false, result: "Improperly set up Battle Videos. Please follow directions and try again" };
    }

    // Start filling up our key...
    // Key Filling (bvkey)
    // Copy in the unique CTR encryption data to ID the video...
    util.copy(video1, 0x10, bvkey, 0, 0x10);

    // Copy unlocking data
    var key1 = new Uint8Array(260); util.copy(video1, 0x4E18, key1, 0, 260);
    util.xor(ekx1, 0, key1, 0, bvkey, 0x100, 260);
    util.copy(video1, 0x4E18 + 260, bvkey, 0x100 + 260, 260*5); // XORstream from save1 has just keystream.

    // See if Opponent first slot can be decrypted...

    breakstream = video1.subarray(0x5438, 0x5438 + 260 * 6);
    // XOR them together at party offset
    for (var i = 0; i < (260 * 6); i++)
        xorstream[i] = (breakstream[i] ^ video2[i + 0x5438]) & 0xFF;
    // XOR through the empty data for the encrypted zero data.
    for (var i = 0; i < (260 * 5); i++)
        bvkey[0x100 + 260 + i] ^= ezeros[i % 260];

    // Retrieve EKX_2's data
    var ekx2 = util.xor(xorstream, 260, ezeros, 0, 260);
    for (var i = 0; i < 260; i++)
        xorstream[i] ^= ekx2[i];
    var pkx2 = Pkx.decrypt(ekx2);
    if (Pkx.verifyChk(Pkx.decrypt(ekx2)) && (pkx2[0x8]|pkx2[0x9]) != 0)
    {
        util.xor(ekx2, 0, video1, 0x5438, bvkey, 0x800, 260);
        util.copy(video1, 0x5438 + 260, bvkey, 0x800 + 260, 260 * 5); // XORstream from save1 has just keystream.

        for (var i = 0; i < (260 * 5); i++)
            bvkey[0x800 + 260 + i] ^= ezeros[i % 260];

        result = "Can dump from Opponent Data on this key too!\n";
    }

    var ot = util.trimCString(util.decodeUnicode16LE(pkx, 0xB0, 24));
    var pkxView = util.createDataView(pkx);
    var tid = pkxView.getUint16(0xC, true);
    var sid = pkxView.getUint16(0xE, true);
    var tsv = ((tid ^ sid) >> 4) & 0xFFFF;
    // Finished, allow dumping of breakstream
    result += `Success!\nYour first Pokemon's TSV: ${util.pad4(tsv)}\nOT: ${ot}\n\nPlease save your keystream.`;

    currentKeyStore.setBvKey(bvkey);
    return { success: true, result: result };

}
