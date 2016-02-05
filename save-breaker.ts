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
            input = input.subarray(input.length - 0x100000);
        case 0x100000:
            var key = await currentKeyStore.getSaveKey(util.getStampSav(input, 0x10));
            return new SaveReaderEncrypted(input, key);
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
    var savkey: Uint8Array;
    var offset = [0, 0];
    var empty = new Uint8Array(232);
    var emptyekx: Uint8Array;
    var pkx = new Uint8Array(232);
    var key: SaveKey;

    if (!util.sequenceEqual(break1, 16, break2, 16, 8)) {
        return { success: false, result: "Saves are not from the same game!\nPlease follow the instructions." };
    }

    if (util.sequenceEqual(break1, break2)) {
        return { success: false, result: "The saves are identical.\nPlease follow the instructions." };
    }

    var dataView1 = util.createDataView(break1);
    var dataView2 = util.createDataView(break2);

    try {
        key = await currentKeyStore.getSaveKey(util.getStampSav(break1, 0x10));
        if (util.sequenceEqual(break1, 0x80000, break2, 0x80000, 0x7f000)) {
            key.slot1Flag = dataView2.getUint32(0x168, true);
        } else if (util.sequenceEqual(break1, 0x1000, break2, 0x1000, 0x7f000)) {
            key.slot1Flag = dataView1.getUint32(0x168, true);
        } else {
            return { success: false, result: "The saves are seperated by more than one save.\nPlease follow the instructions." };
        }

        util.xor(break1, key.boxOffset, break1, key.boxOffset - 0x7f000, key.slot1Key, 0, 232*30*31);

        var reader1, reader2;
        reader1 = new SaveReaderEncrypted(break1, key);
        reader1.scanSlots();
        reader2 = new SaveReaderEncrypted(break2, key);
        reader2.scanSlots();

        return { success: true, result: "Found old key. Based new keystream on that.\n\nSaving new Keystream." };
    } catch (e) {}

    savkey = new Uint8Array(0xB4AD4);
    key = new SaveKey(savkey);

    if (util.sequenceEqual(break1, 0x80000, break2, 0x80000, 0x7f000)) {
        // TODO method to xor three
        // write slot 1 to slot 2 for breaking purposes
        // TODO create a copy as not to overwrite input data?
        for (var i = 162304; i < 446160; ++i) {
            break2[i + 520192] = ((break2[i] ^ break1[i] ^ break1[i + 520192]) & 0xFF);
        }

        // Copy the key for the slot selector
        key.slot1Flag = dataView2.getUint32(0x168, true);

        // Copy the key for the other save slot
        util.xor(break2, offset[0], break2, offset[0] - 0x7f000, savkey, 0x80004, 232*30*31);
    } else if (util.sequenceEqual(break1, 4096, break2, 4096, 520192)) {
        // Copy the key for the slot selector
        key.slot1Flag = dataView1.getUint32(0x168, true);

        // Copy the key for the other save slot
        util.xor(break2, offset[0], break2, offset[0] - 0x7f000, savkey, 0x80004, 232*30*31);
    }

    var tmpBreak = break1; break1 = break2; break2 = tmpBreak;
    var tmpDataView = dataView1; dataView1 = dataView2; dataView2 = tmpDataView;

    //#region Finding the User Specific Data: Using Valid to keep track of progress...
    // Do Break. Let's first do some sanity checking to find out the 2 offsets we're dumping from.
    // Loop through save file to find
    var fo = 682496; // Initial Offset, can tweak later.

    for (var d = 0; d < 2; d++) {
        // Do this twice to get both box offsets.
        for (var i = fo; i <= 757552; i += 68096) {
            var err = 0;
            // Start at findoffset and see if it matches pattern
            // TODO what "pattern"
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

    // Okay, now that we have the encrypted streams, formulate our EKX.
    // TODO why number one specifically?
    // TODO do we actually need to set this?
    var nick = eggnames[1];
    // Stuff in the nickname to our blank EKX.
    var nicknamebytes = util.encodeUnicode16LE(nick);
    util.copy(nicknamebytes, 0, empty, 64, nicknamebytes.length);

    // Encrypt the Empty PKX to EKX.
    emptyekx = Pkx.encrypt(empty);
    // Not gonna bother with the checksum, as this empty file is temporary.

    // Sweet. Now we just have to find the E0-E3 values. Let's get our polluted streams from each.
    // Save file 1 has empty box 1. Save file 2 has empty box 2.

    // Cool. So we have a fairly decent keystream to roll with. We now need to find what the E0-E3 region is.
    // 0x00000000 Encryption Constant has the D block last.
    // We need to make sure our Supplied Encryption Constant Pokemon have the D block somewhere else (Pref in 1 or 3).

    var valid = false;
    for (var i = 0; i < 6; i++) {
        // First, let's get out our polluted EKX's.
        var polekx = new Uint8Array(232);
        for (var j = 0; j < 232; j++) {
            // TODO write method to xor three
            polekx[j] = break1[offset[1] + 232 * i + j] ^ break2[offset[1] + i * 232 + j] ^ emptyekx[j];
        }
        let encryptionconstant = util.createDataView(polekx).getUint32(0, true);

        // EC Obtained. Check to see if Block D is not last.
        // If Block D is last, the location data wouldn't be correct and we need that to fix the keystream.
        if (Pkx.getDloc(encryptionconstant[i]) != 3) {
            valid = true;
            // Find the Origin/Region data.
            var decryptedpkx = Pkx.decrypt(polekx);

            // finalize data

            // Okay, now that we have the encrypted streams, formulate our EKX.
            nick = eggnames[decryptedpkx[227] - 1];
            // Stuff in the nickname to our blank EKX.
            // TODO get a method to write bytes directly to uint8array
            nicknamebytes = util.encodeUnicode16LE(nick);
            util.copy(nicknamebytes, 0, empty, 64, nicknamebytes.length);

            // Dump it into our Blank EKX. We have won!
            util.copy(decryptedpkx, 224, empty, 224, 4);
            break;
        }
    }
    //#endregion

    if (!valid) { // We didn't get any valid EC's where D was not in last. Tell the user to try again with different specimens.
        return { success: false, result: "The 6 supplied Pokemon are not suitable. \nRip new saves with 6 different ones that originated from your save file.\nKeystreams were NOT bruteforced!\n\nStart over and try again :(" };
    }

    //#region Fix up our Empty File
    // We can continue to get our actual keystream.
    // Let's calculate the actual checksum of our empty pkx.
    // TODO use a util function to create Uint16Array
    // TODO write a "fix checksum" function
    var empty16 = new Uint16Array(empty.buffer);
    var chk = 0;
    for (var i = 4; i < 116 /* 232 / 2 */; i++) {
        chk += empty16[i];
    }

    // Apply New Checksum
    empty16[3] = chk;

    // Okay. So we're now fixed with the proper blank PKX. Encrypt it!
    emptyekx = Pkx.encrypt(empty);

    // Copy over 0x10-0x1F (Save Encryption Unused Data so we can track data).
    util.copy(break1, 16, savkey, 0, 8);
    // Include empty data
    util.copy(empty, 224, savkey, 16, 4);
    // Copy over the scan offsets.
    util.createDataView(savkey).setUint32(28, offset[0], true);

    for (var i = 0; i < 30; i++) {
        util.xor(break1, i * 232 + offset[0], emptyekx, 0, savkey, 0x100 + i * 232, 232);
        util.xor(break2, i * 232 + offset[1], emptyekx, 0, savkey, 0x100 + (30 * 232) + i * 232, 232);
    }

    //#endregion
    // Let's extract some of the information now for when we set the Keystream filename.
    //#region Keystream Naming
    var data1 = util.xor(savkey, 256+i, break1, offset[0], 232);
    var data2 = util.xor(savkey, 256+i, break2, offset[0], 232);
    var pkx1 = Pkx.decrypt(data1);
    var pkx2 = Pkx.decrypt(data2);
    if (Pkx.verifyChk(pkx1) && (pkx1[8] | pkx1[9])) {
        // Save 1 has the box1 data
        pkx = pkx1;
    }
    else if (Pkx.verifyChk(pkx2) && (pkx2[8] | pkx2[9])) {
        // Save 2 has the box1 data
        pkx = pkx2;
    } else {
        // Data isn't decrypting right...
        util.xorInPlace(data1, 0, empty, 0, 232);
        util.xorInPlace(data2, 0, empty, 0, 232);

        pkx1 = Pkx.decrypt(data1);
        pkx2 = Pkx.decrypt(data2);

        if (Pkx.verifyChk(pkx1) && (pkx1[8] | pkx1[9])) {
            // TODO don't we already know this?
            // Save 1 has the box1 data
            pkx = pkx1;
        } else if (Pkx.verifyChk(pkx2) && (pkx2[8] | pkx2[9])) {
            // Save 2 has the box1 data
            pkx = pkx2;
        } else {
            // Sigh...
            // TODO when would this ever occur?
            return { success: false, result: "Sigh..." };
        }
    }
    //#endregion

    // TODO Yes we do.
    // TODO check both slot1 and slot2 of each save
    // Since we don't know if the user put them in in the wrong order, let's just markup our keystream with data.
    for (var i = 0; i < 31; i++) {
        for (var j = 0; j < 30; j++) {
            if (util.sequenceEqual(break1, offset[0] + i * 232 * 30 + j * 232, break2, offset[0] + i * 232 * 30 + j * 232, 232)) {
                // Copy slot into the key file only once if it is equal in both saves.
                util.copy(break1, offset[0] + i * 232 * 30 + j * 232, savkey, 0x100 + i * 232 * 30 + j * 232, 232);
            } else {
                // Copy slot from both saves into their keystream spots.
                util.copy(break1, offset[0] + i * 232 * 30 + j * 232, savkey, 0x100 + i * 232 * 30 + j * 232, 232);
                util.copy(break2, offset[0] + i * 232 * 30 + j * 232, savkey, 0x40000 + i * 232 * 30 + j * 232, 232);
            }
        }
    }

    // Save file diff is done, now we're essentially done. Save the keystream.
    // Success
    currentKeyStore.setSaveKey(new SaveKey(savkey), new Pkx(pkx, 0, 1, false));
    return {
        success: true,
        result: "Keystreams were successfully bruteforced!\n\nSaving your keystream now..."
    };
}
