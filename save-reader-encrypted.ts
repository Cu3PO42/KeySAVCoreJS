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
        // Auto updates the keystream when it dumps important data!
        var pkx: Uint8Array;

        var keyOffset = pos * 232;
        var savOffset = keyOffset + this.key.boxOffset - (1 - slot) * 520192;

        if (util.empty(this.key.boxKey1, keyOffset, 232)) {
            if (util.empty(this.key.boxKey2, keyOffset, 232)) {
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

        var data1 = util.xor(this.sav, savOffset, this.key.boxKey1, keyOffset, 232);
        var data2 = util.xor(this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
        var possibleExtraKeys = [zeros, ezeros, this.key.blank];
        var possibleEkx1 = possibleExtraKeys.map((e) => util.xor(data1, e));
        var possibleEkx2 = possibleExtraKeys.map((e) => util.xor(data2, e));

        function tryDecrypt(possibleEkx: Uint8Array[], sourceKey: Uint8Array, sourceOffset: number, destinationKey: Uint8Array): [Uint8Array, boolean] {
            var pkx: Uint8Array;
            for (var i = 0; i < possibleExtraKeys.length; ++i) {
                pkx = possibleEkx[i];
                if (Pkx.verifyChk(pkx)) {
                    util.xor(possibleExtraKeys[i], 0, sourceKey, sourceOffset, destinationKey, keyOffset, 232);
                    return [pkx, true];
                }
            }

            return [undefined, false];
        }

        if (util.empty(this.key.boxKey2, keyOffset, 232)) {
            if (possibleEkx1.some(util.empty)) {
                // Slot hasn't changed.
                return [undefined, false];
            }

            return tryDecrypt(possibleEkx1, this.sav, savOffset, this.key.boxKey2);
        }

        if (possibleEkx1.some(util.empty)) {
            // Save  is the same as key 1
            return tryDecrypt(possibleEkx2, this.key.boxKey2, keyOffset, this.key.boxKey2);
        }

        if (possibleEkx2.some(util.empty)) {
            // Save is the same as key 2
            return tryDecrypt(possibleEkx1, this.key.boxKey1, keyOffset, this.key.boxKey1);
        }

        // Data has been observed to change twice! We can potentially get our exact keystream now!
        // Either key1 or key2 or save would be empty.
        for (let possibleEkx of possibleEkx1) {
            pkx = Pkx.decrypt(possibleEkx);
            if (!Pkx.verifyChk(pkx)) {
                continue;
            }

            if (possibleEkx2.some((e) => Pkx.verifyChk(Pkx.decrypt(e)))) {
                // Save file is empty
                util.xor(possibleEkx, 0, this.key.boxKey1, keyOffset, this.key.boxKey2, keyOffset, 232);
            } else {
                // Key 1 is empty
                util.xor(possibleEkx, 0, this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
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
