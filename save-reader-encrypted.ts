"use strict";

import SaveReader from "./save-reader";
import SaveKey from "./save-key";
import Pkx from "./pkx";
import * as util from "./util";

var zeros = new Uint8Array(232);
var ezeros = Pkx.encrypt(zeros);

export { default as SaveReader } from "./save-reader";
export default class SaveReaderEncrypted implements SaveReader {
    private activeSlot: number;

    get unlockedSlots() {
        var res = 0;
        for (var i = 0; i < this.key.slotsUnlocked.length; ++i)
            if (this.key.slotsUnlocked[i] != 0)
                ++res;
        return res;
    }

    get isNewKey() {
        return this.key.isNewKey;
    }

    constructor(private sav: Uint8Array, private key: SaveKey) {
        this.activeSlot = this.key.slot1Flag == util.createDataView(sav).getUint32(0x168, true) && this.key.isNewKey ? 0 : 1;
        util.xorInPlace(sav, key.boxOffset - 0x7F000, key.slot1Key, 0, 232 * 30 * 31);
    }

    scanSlots(pos1?: number, pos2?: number) {
        if (Number.isInteger(pos1)) {
            if (!Number.isInteger(pos2)) {
                pos2 = pos1;
            }
        } else {
            pos1 = 0;
            pos2 = 31 * 30 + 1;
        }

        for (let i = pos1; i < pos2; ++i) {
            this.getPkxRaw(i, 0);
            this.getPkxRaw(i, 1);
        }
    }

    getPkx(pos: number) {
        var res = this.getPkxRaw(pos, this.activeSlot), data = res[0], ghost = res[1];
        if (data === undefined || (data[8] | data[9]) == 0)
            return undefined;
        return new Pkx(data, (pos / 30) | 0, pos % 30, ghost);
    }

    private getPkxRaw(pos: number, slot: number): [Uint8Array, boolean] {
        // TODO refactor moar
        // Auto updates the keystream when it dumps important data!
        var ekx: Uint8Array;
        var pkx: Uint8Array;

        var keyOffset = pos * 232;
        var savOffset = keyOffset + this.key.boxOffset - (1 - slot) * 520192;

        if (util.empty(this.key.boxKey1, keyOffset, 232)) {
            if (util.sequenceEqual(zeros, this.key.boxKey2, keyOffset)) {
                // We don't have any data for this slot
                util.copy(this.sav, savOffset, this.key.boxKey1, keyOffset, 232);
                return [undefined, false];
            }

            // We have a key2 only, this is supposed to be the actual key
            pkx = Pkx.decrypt(util.xor(this.key.boxKey2, keyOffset, this.sav, savOffset, 232));
            if (Pkx.verifyChk(pkx)) {
                return [pkx, false];
            } else {
                // Something is wrong. Our data didn't decrypt properly. Apparently the key is wrong.
                util.copy(zeros, 0, this.key.boxKey2, keyOffset, 232);
                return [undefined, false];
            }
        }

        if (util.empty(this.key.boxKey2, keyOffset, 232)) {
            if (util.sequenceEqual(this.key.boxKey1, keyOffset, this.sav, savOffset, 232)) {
                // Slot hasn't changed.
                return [undefined, false];
            }

            // Try to decrypt the data
            ekx = util.xor(this.key.boxKey1, keyOffset, this.sav, savOffset, 232);
            pkx = Pkx.decrypt(ekx);
            if (Pkx.verifyChk(pkx)) {
                util.copy(this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
                return [pkx, true];
            }

            // Try xoring with the empty data.
            pkx = Pkx.decrypt(util.xor(ekx, this.key.blank));
            if (Pkx.verifyChk(pkx)) {
                util.xor(this.key.blank, 0, this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
                return [pkx, true];
            }

            pkx = Pkx.decrypt(util.xor(ekx, ezeros));
            if (Pkx.verifyChk(pkx)) {
                util.xor(ezeros, 0, this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
                return [pkx, true];
            }

            return [undefined, false]; // Not a failed decryption; we just haven't seen new data here yet.
        }

        var data1 = util.xor(this.sav, savOffset, this.key.boxKey1, keyOffset, 232);
        var data2 = util.xor(this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
        var possibleEkx1 = [data1, util.xor(data1, ezeros), util.xor(data1, this.key.blank)];
        var possibleEkx2 = [data2, util.xor(data2, ezeros), util.xor(data2, this.key.blank)];

        // We've dumped data at least once.
        if (possibleEkx1.some(util.empty)) {
            // Data is back to break state, but we can still dump with the other key.

            ekx = util.xor(this.key.boxKey2, keyOffset, this.sav, savOffset, 232);
            pkx = Pkx.decrypt(ekx);
            if (Pkx.verifyChk(pkx)) {
                return [pkx, true];
            }

            pkx = Pkx.decrypt(util.xor(ekx, this.key.blank));
            if (Pkx.verifyChk(pkx)) {
                util.xor(this.key.blank, 0, this.key.boxKey2, keyOffset, this.key.boxKey2, keyOffset, 232);
                return [pkx, true];
            }

            pkx = Pkx.decrypt(util.xor(ekx, ezeros));
            if (Pkx.verifyChk(pkx)) {
                // Key1 decrypts our data after we remove encrypted zeros.
                // Copy Key1 to Key2, then zero out Key1.
                // TODO ugh. I don't know about this. Are we really done?
                util.xor(ezeros, 0, this.key.boxKey2, keyOffset, this.key.boxKey2, keyOffset, 232);
                return [pkx, true];
            }

            // TODO is this really an error? do we need to reset here?
            return [undefined, false]; // Decryption Error
        }

        if (possibleEkx2.some(util.empty)) {
            // Data is changed only once to a dumpable, but we can still dump with the other key.
            ekx = util.xor(this.key.boxKey1, keyOffset, this.sav, savOffset, 232);
            pkx = Pkx.decrypt(ekx);
            if (Pkx.verifyChk(pkx)) {
                return [pkx, true];
            }

            pkx = Pkx.decrypt(util.xor(ekx, this.key.blank));
            if (Pkx.verifyChk(pkx)) {
                util.xor(this.key.blank, 0, this.key.boxKey1, keyOffset, this.key.boxKey1, keyOffset, 232);
                return [pkx, true];
            }

            pkx = Pkx.decrypt(util.xor(ekx, ezeros));
            if (Pkx.verifyChk(pkx)) {
                util.xor(ezeros, 0, this.key.boxKey1, keyOffset, this.key.boxKey1, keyOffset, 232);
                return [pkx, true];
            }

            return [undefined, false]; // Decryption Error
        }

        // Data has been observed to change twice! We can potentially get our exact keystream now!
        // Either key1 or key2 or save would be empty.
        for (let possibleEkx of possibleEkx1) {
            pkx = Pkx.decrypt(possibleEkx);
            if (!Pkx.verifyChk(pkx)) {
                continue;
            }

            if (possibleEkx2.filter((e) => Pkx.verifyChk(Pkx.decrypt(e))).length === 0) {
                // Key 1 is empty
                util.xor(possibleEkx, 0, this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
            } else {
                // Save file is empty
                util.xor(possibleEkx, 0, this.key.boxKey1, keyOffset, this.key.boxKey2, keyOffset, 232);
            }

            util.copy(zeros, 0, this.key.boxKey1, keyOffset, 232);
            return [pkx, false];
        }
        for (let possibleEkx of possibleEkx2) {
            pkx = Pkx.decrypt(possibleEkx);
            if (!Pkx.verifyChk(pkx)) {
                continue;
            }

            // Key 2 is empty
            util.xor(possibleEkx, 0, this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
            util.copy(zeros, 0, this.key.boxKey1, keyOffset, 232);
            return [pkx, false];
        }

        // None of the three files are empty
        return [undefined, false];
    }
}
