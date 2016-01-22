"use strict";

import SaveReader from "./save-reader";
import SaveKey from "./save-key";
import SaveReaderEncrypted from "./save-reader-encrypted";
import SaveReaderDecrypted from "./save-reader-decrypted";
import KeyStore from "./key-store";
import { currentKeyStore } from "./key-store";
import Pkx from "./pkx";
import * as util from "./util";

const magic = 0x42454546;
export const eggnames: string[] = ["タマゴ", "Egg", "Œuf", "Uovo", "Ei", "", "Huevo", "알"];

export async function load(input: Uint8Array): Promise<SaveReader> {
    var view = util.createDataView(input);
    switch (input.length) {
        case 0x10009C:
        case 0x10019A:
        case 0x100000:
            var key = await currentKeyStore.getSaveKey(util.getStamp(input, 0x10));
            return new SaveReaderEncrypted(input.length === 0x100000 ? input
                : input.subarray(input.length-0x100000), key);
        case 0x76000:
            if (view.getUint32(0x75E10, true) != magic)
                throw new Error("No save.");
            return new SaveReaderDecrypted(input, "ORAS");
        case 0x65600:
            if (view.getUint32(0x65410, true) != magic)
                throw new Error("No save.");
            return new SaveReaderDecrypted(input, "XY");
        case 232 * 30 * 32:
            return new SaveReaderDecrypted(input, "YABD");
        case 232 * 30 * 31:
            return new SaveReaderDecrypted(input, "PCDATA");
        case 0x70000:
            return new SaveReaderDecrypted(input, "ORASRAM");
        default:
            throw new Error("No save.");
    }
}

export interface SaveBreakResult {
    success: boolean;
    result: string;
}

export async function breakKey(break1: Uint8Array, break2: Uint8Array): Promise<SaveBreakResult> {
    var offset = [0, 0];
    var empty = new Uint8Array(232);
    var emptyekx = new Uint8Array(232);
    var pkx = new Uint8Array(232);
    var savkey;
    savkey = new Uint8Array(740052);
    var result;

    if (!util.sequenceEqual(break1, 16, break2, 16, 8)) {
        return { success: false, result: "Saves are not from the same game!\nPlease follow the instructions." };
    }

    if (util.sequenceEqual(break1, break2)) {
        return { success: false, result: "The saves are identical.\nPlease follow the instructions." };
    }

    var dataView1 = util.createDataView(break1);
    var dataView2 = util.createDataView(break2);

    var key = await currentKeyStore.getSaveKey(util.getStamp(break1, 0x10));
    if (key !== undefined) {
        if (util.sequenceEqual(break1, 524288, break2, 524288, 520192)) {
            key.slot1Flag = dataView2.getUint32(360, true);
        } else if (util.sequenceEqual(break1, 4096, break2, 4096, 520192)) {
            key.slot1Flag = dataView1.getUint32(360, true);
        } else {
            return { success: false, result: "The saves are seperated by more than one save.\nPlease follow the instructions." };
        }

        util.xor(break1, key.boxOffset, break1, key.boxOffset - 520192, key.slot1Key, 0, 232*30*31);

        var reader1, reader2;
        reader1 = new SaveReaderEncrypted(break1, key);
        reader1.scanSlots();
        reader2 = new SaveReaderEncrypted(break2, key);
        reader2.scanSlots();

        return { success: true, result: "Found old key. Based new keystream on that.\n\nPlease save new Keystream.", res: key };
    }

    if (util.sequenceEqual(break1, 524288, break2, 524288, 520192)) {
        for (var i = 162304; i < 446160; ++i) {
            break2[i + 520192] = ((break2[i] ^ break1[i] ^ break1[i + 520192]) & 0xFF);
        }

        // Copy the key for the slot selector
        util.copy(break2, 360, savkey, 524288, 4);

        // Copy the key for the other save slot
        util.xor(break2, offset[0], break2, offset[0] - 520192, savkey, 524292,
            215760 /* 232*30*31 */);
    } else if (util.sequenceEqual(break1, 4096, break2, 4096, 520192)) {
        // Copy the key for the slot selector
        util.copy(break1, 360, savkey, 524288, 4);

        // Copy the key for the other save slot
        util.xor(break2, offset[0], break2, offset[0] - 520192, savkey, 524292,
            215760 /* 232*30*31 */);
    }

    var tmpBreak = break1; break1 = break2; break2 = tmpBreak;
    var dataViewBreak = dataView1; dataView1 = dataView2; dataView2 = dataView1;

    //#region Finding the User Specific Data: Using Valid to keep track of progress...
    // Do Break. Let's first do some sanity checking to find out the 2 offsets we're dumping from.
    // Loop through save file to find
    var fo = 682496; // Initial Offset, can tweak later.

    for (var d = 0; d < 2; d++) {
        // Do this twice to get both box offsets.
        for (var i = fo; i <= 757552; i += 68096) {
            var err = 0;
            // Start at findoffset and see if it matches pattern
            if ((break1[i + 4] == break2[i + 4]) && (break1[i + 4 + 232] == break2[i + 4 + 232])) {
                // Sanity Placeholders are the same
                for (var j = 0; j < 4; j++) {
                    if (break1[i + j] == break2[i + j])
                        err++;
                }

                if (err < 4) {
                    // Keystream ^ PID doesn't match entirely. Keep checking.
                    for (var j = 8; j < 232; j++) {
                        if (break1[i + j] == break2[i + j])
                            err++;
                    }

                    if (err < 20) {
                        // Tolerable amount of difference between offsets. We have a result.
                        offset[d] = i;
                        break;
                    }
                }
            }
        }
        fo = offset[d] + 6960 /* 232 * 30 */; // Fast forward out of this box to find the next.
    }

    // Now that we have our two box offsets...
    // Check to see if we actually have them.

    if ((offset[0] == 0) || (offset[1] == 0)) {
        // We have a problem. Don't continue.
        return { success: false, result: "Unable to Find Box.\nKeystreams were NOT bruteforced!\n\nStart over and try again :(" };
    }

    // Let's go deeper. We have the two box offsets.
    // Chunk up the base streams.
    var estream1 = new Uint8Array(6960 /* 30 * 232 */);
    var estream2 = new Uint8Array(6960 /* 30 * 232 */);
    // Stuff 'em.
    for (var i = 0; i < 30; i++) {
        for (var j = 0; j < 232; j++) {
            estream1[i * 232 + j] = break1[offset[0] + 232 * i + j];
            estream2[i * 232 + j] = break2[offset[1] + 232 * i + j];
        }
    }

    // Okay, now that we have the encrypted streams, formulate our EKX.
    var nick = eggnames[1];
    // Stuff in the nickname to our blank EKX.
    var nicknamebytes = util.encodeUnicode16LE(nick);
    util.copy(nicknamebytes, 0, empty, 64, nicknamebytes.length);

    // Encrypt the Empty PKX to EKX.
    util.copy(empty, 0, emptyekx, 0, 232);
    emptyekx = Pkx.decrypt(emptyekx);
    // Not gonna bother with the checksum, as this empty file is temporary.

    // Sweet. Now we just have to find the E0-E3 values. Let's get our polluted streams from each.
    // Save file 1 has empty box 1. Save file 2 has empty box 2.
    var pstream1 = new Uint8Array(6960 /* 30 * 232 */); // Polluted Keystream 1
    var pstream2 = new Uint8Array(6960 /* 30 * 232 */); // Polluted Keystream 2
    for (var i = 0; i < 30; i++) {
        for (var j = 0; j < 232; j++) {
            pstream1[i * 232 + j] = ((estream1[i * 232 + j] ^ emptyekx[j]) & 0xFF);
            pstream2[i * 232 + j] = ((estream2[i * 232 + j] ^ emptyekx[j]) & 0xFF);
        }
    }

    // Cool. So we have a fairly decent keystream to roll with. We now need to find what the E0-E3 region is.
    // 0x00000000 Encryption Constant has the D block last.
    // We need to make sure our Supplied Encryption Constant Pokemon have the D block somewhere else (Pref in 1 or 3).

    // First, let's get out our polluted EKX's.
    var polekx = [new Uint8Array(232), new Uint8Array(232), new Uint8Array(232),
                  new Uint8Array(232), new Uint8Array(232), new Uint8Array(232)];
    for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 232; j++) {
            polekx[i][j] = ((break1[offset[1] + 232 * i + j] ^ pstream2[i * 232 + j]) & 0xFF);
        }
    }

    var encryptionconstants = <number[]>new Array(6); // Array for all 6 Encryption Constants.
    var valid = 0;
    for (var i = 0; i < 6; i++) {
        encryptionconstants[i] = polekx[i][0];
        encryptionconstants[i] += polekx[i][1] * 256;
        encryptionconstants[i] += polekx[i][2] * 65536;
        encryptionconstants[i] += polekx[i][3] * 16777216;
        // EC Obtained. Check to see if Block D is not last.
        if (Pkx.getDloc(encryptionconstants[i]) != 3) {
            valid++;
            // Find the Origin/Region data.
            var encryptedekx = new Uint8Array(232);
            var decryptedpkx = new Uint8Array(232);
            for (var z = 0; z < 232; z++) {
                encryptedekx[z] = polekx[i][z];
            }

            decryptedpkx = Pkx.decrypt(encryptedekx);

            // finalize data

            // Okay, now that we have the encrypted streams, formulate our EKX.
            nick = eggnames[decryptedpkx[227] - 1];
            // Stuff in the nickname to our blank EKX.
            nicknamebytes = util.encodeUnicode16LE(nick);
            util.copy(nicknamebytes, 0, empty, 64, nicknamebytes.length);

            // Dump it into our Blank EKX. We have won!
            empty[224] = decryptedpkx[224];
            empty[225] = decryptedpkx[225];
            empty[226] = decryptedpkx[226];
            empty[227] = decryptedpkx[227];
            break;
        }
    }
    //#endregion

    if (valid == 0) { // We didn't get any valid EC's where D was not in last. Tell the user to try again with different specimens.
        return { success: false, result: "The 6 supplied Pokemon are not suitable. \nRip new saves with 6 different ones that originated from your save file.\nKeystreams were NOT bruteforced!\n\nStart over and try again :(" };
    }

    //#region Fix up our Empty File
    // We can continue to get our actual keystream.
    // Let's calculate the actual checksum of our empty pkx.
    var empty16 = new Uint16Array(empty.buffer);
    var chk = 0;
    for (var i = 4; i < 116 /* 232 / 2 */; i++) {
        chk += empty16[i];
    }

    // Apply New Checksum
    empty16[3] = chk;

    // Okay. So we're now fixed with the proper blank PKX. Encrypt it!
    util.copy(empty, 0, emptyekx, 0, 232);
    emptyekx = Pkx.encrypt(emptyekx);

    // Copy over 0x10-0x1F (Save Encryption Unused Data so we can track data).
    util.copy(break1, 16, savkey, 0, 8);
    // Include empty data
    savkey[16] = empty[224];
    savkey[17] = empty[225];
    savkey[18] = empty[226];
    savkey[19] = empty[227];
    // Copy over the scan offsets.
    util.createDataView(savkey).setUint32(28, offset[0], true);

    for (var i = 0; i < 30; i++) {
        for (var j = 0; j < 232; j++) {
            savkey[256 + i * 232 + j] = ((estream1[i * 232 + j] ^ emptyekx[j]) & 0xFF);
            savkey[7216 /* 0x100 + (30 * 232) */ + i * 232 + j] = ((estream2[i * 232 + j] ^ emptyekx[j]) & 0xFF);
        }
    }
    //#endregion
    // Let's extract some of the information now for when we set the Keystream filename.
    //#region Keystream Naming
    var data1 = new Uint8Array(232);
    var data2 = new Uint8Array(232);
    for (var i = 0; i < 232; i++) {
        data1[i] = ((savkey[256 + i] ^ break1[offset[0] + i]) & 0xFF);
        data2[i] = ((savkey[256 + i] ^ break2[offset[0] + i]) & 0xFF);
    }
    var data1a = new Uint8Array(232);
    var data2a = new Uint8Array(232);
    util.copy(data1, 0, data1a, 0, 232);
    util.copy(data2, 0, data2a, 0, 232);
    var pkx1 = Pkx.decrypt(data1);
    var pkx2 = Pkx.decrypt(data2);
    if (Pkx.verifyChk(pkx1) && (pkx1[8] | pkx1[9])) {
        // Save 1 has the box1 data
        pkx = pkx1;
    }
    else
        if (Pkx.verifyChk(pkx2) && (pkx2[8] | pkx2[9])) {
            // Save 2 has the box1 data
            pkx = pkx2;
        } else {
            // Data isn't decrypting right...
            for (var i = 0; i < 232; i++) {
                data1a[i] ^= empty[i];
                data2a[i] ^= empty[i];
            }
            pkx1 = Pkx.decrypt(data1a);
            pkx2 = Pkx.decrypt(data2a);
            if (Pkx.verifyChk(pkx1) && (pkx1[8] | pkx1[9])) {
                // Save 1 has the box1 data
                pkx = pkx1;
            } else if (Pkx.verifyChk(pkx2) && (pkx2[8] | pkx2[9])) {
                // Save 2 has the box1 data
                pkx = pkx2;
            } else {
                // Sigh...
                return { success: false, result: "Sigh..." };
            }
        }
    //#endregion

    // Clear the keystream file...
    savkey.fill(0, 256, 216016 /* 0x100+232*30*31 */);
    savkey.fill(0, 262144, 477904 /* 0x40000+232*30*31 */);

    // Since we don't know if the user put them in in the wrong order, let's just markup our keystream with data.
    var data1 = new Uint8Array(232);
    var data2 = new Uint8Array(232);
    for (var i = 0; i < 31; i++) {
        for (var j = 0; j < 30; j++) {
            util.copy(break1, offset[0] + i * 6960 /* 232 * 30 */ + j * 232,
                data1, 0, 232);
            util.copy(break2, offset[0] + i * 6960 /* 232 * 30 */ + j * 232,
                data2, 0, 232);
            if (util.sequenceEqual(data1, data2)) {
                // Just copy data1 into the key file.
                util.copy(data1, 0, savkey, 256 + i * 6960 /* 232 * 30 */ + j * 232,
                    232);
            }
            else {
                // Copy both datas into their keystream spots.
                util.copy(data1, 0, savkey, 256 + i * 6960 /* 232 * 30 */ + j * 232,
                    232);
                util.copy(data2, 0, savkey, 262144 + i * 6960 /* 232 * 30 */ + j * 232,
                    232);
            }
        }
    }

    // Save file diff is done, now we're essentially done. Save the keystream.
    // Success
    currentKeyStore.setSaveKey(new SaveKey(savkey), new Pkx(pkx, 0, 1, false));
    return {
        success: true,
        result: "Keystreams were successfully bruteforced!\n\nSave your keystream now..."
    };
}
