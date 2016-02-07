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
        var ekx = new Uint8Array(232);

        var ghost = true;

        var keyOffset = pos * 232;
        var savOffset = keyOffset + this.key.boxOffset - (1 - slot) * 520192;

        if (util.sequenceEqual(zeros, this.key.boxKey1, keyOffset) && util.sequenceEqual(zeros, this.key.boxKey2, keyOffset))
            return [undefined, false];
        else if (util.sequenceEqual(zeros, this.key.boxKey1, keyOffset)) {
            // Key2 is confirmed to dump the data.
            ekx = util.xor(this.key.boxKey2, keyOffset, this.sav, savOffset, 232);
            ghost = false;
            this.key.slotsUnlocked[slot] = 1;
        } else if (util.sequenceEqual(zeros, this.key.boxKey2, keyOffset)) {
            // Haven't dumped from this slot yet.
            if (util.sequenceEqual(this.key.boxKey1, keyOffset, this.sav, savOffset, 232)) {
                // Slot hasn't changed.
                return [undefined, false];
            } else {
                // Try and decrypt the data...
                ekx = util.xor(this.key.boxKey1, keyOffset, this.sav, savOffset, 232);
                if (Pkx.verifyChk(Pkx.decrypt(ekx))) {
                    // Data has been dumped!
                    // Fill keystream data with our log.
                    util.copy(this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
                } else {
                    // Try xoring with the empty data.
                    if (Pkx.verifyChk(Pkx.decrypt(util.xor(ekx, this.key.blank)))) {
                        ekx = util.xor(ekx, this.key.blank);
                        util.xor(this.key.blank, 0, this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
                    } else if (Pkx.verifyChk(Pkx.decrypt(util.xor(ekx, ezeros)))) {
                        ekx = util.xor(ekx, ezeros);
                        util.xor(ezeros, 0, this.sav, savOffset, this.key.boxKey2, keyOffset, 232);
                    } else
                        return [undefined, false]; // Not a failed decryption; we just haven't seen new data here yet.
                }
            }
        }
        else {
            // We've dumped data at least once.
            if (util.sequenceEqual(this.key.boxKey1, keyOffset, this.sav, savOffset,
                232) || util.sequenceEqual(this.key.boxKey1, keyOffset, util.xor(this.key.blank,
                    this.sav, savOffset), 0, 232) || util.sequenceEqual(this.key.boxKey1,
                    keyOffset, util.xor(ezeros, this.sav, savOffset), 0, 232)) {
                // Data is back to break state, but we can still dump with the other key.
                ekx = util.xor(this.key.boxKey2, keyOffset, this.sav, savOffset, 232);
                if (!Pkx.verifyChk(Pkx.decrypt(ekx))) {
                    if (Pkx.verifyChk(Pkx.decrypt(util.xor(ekx,
                        this.key.blank)))) {
                        ekx = util.xor(ekx, this.key.blank);
                        util.xor(this.key.blank, 0, this.key.boxKey2, keyOffset,
                            this.key.boxKey2, keyOffset, 232);
                    } else if (Pkx.verifyChk(Pkx.decrypt(util.xor(ekx,
                            ezeros)))) {
                        // Key1 decrypts our data after we remove encrypted zeros.
                        // Copy Key1 to Key2, then zero out Key1.
                        ekx = util.xor(ekx, ezeros);
                        util.xor(ezeros, 0, this.key.boxKey2, keyOffset,
                            this.key.boxKey2, keyOffset, 232);
                    } else
                        return [undefined, false]; // Decryption Error
                }
            } else if (util.sequenceEqual(this.key.boxKey2, keyOffset, this.sav,
                savOffset, 232) || util.sequenceEqual(this.key.boxKey2, keyOffset,
                    util.xor(this.key.blank, this.sav, savOffset), 0, 232) || util.sequenceEqual(this.key.boxKey2,
                    keyOffset, util.xor(ezeros, this.sav, savOffset), 0, 232)) {
                // Data is changed only once to a dumpable, but we can still dump with the other key.
                ekx = util.xor(this.key.boxKey1, keyOffset, this.sav, savOffset, 232);
                if (!Pkx.verifyChk(Pkx.decrypt(ekx))) {
                    if (Pkx.verifyChk(Pkx.decrypt(util.xor(ekx,
                        this.key.blank)))) {
                        ekx = util.xor(ekx, this.key.blank);
                        util.xor(this.key.blank, 0, this.key.boxKey1, keyOffset,
                            this.key.boxKey1, keyOffset, 232);
                    }
                    else if (Pkx.verifyChk(Pkx.decrypt(util.xor(ekx, ezeros)))) {
                        ekx = util.xor(ekx, ezeros);
                        util.xor(ezeros, 0, this.key.boxKey1, keyOffset,
                            this.key.boxKey1, keyOffset, 232);
                    }
                    else
                        return [undefined, false]; // Decryption Error
                }
            } else {
                // Data has been observed to change twice! We can get our exact keystream now!
                // Either Key1 or Key2 or Save is empty. Whichever one decrypts properly is the empty data.
                // Oh boy... here we go...
                ghost = false;
                this.key.slotsUnlocked[slot] = 1;
                var keydata1, keydata2 = false;
                var data1 = util.xor(this.sav, savOffset, this.key.boxKey1,
                    keyOffset, 232);
                var data2 = util.xor(this.sav, savOffset, this.key.boxKey2,
                    keyOffset, 232);

                keydata1 = (Pkx.verifyChk(Pkx.decrypt(data1)) || Pkx.verifyChk(Pkx.decrypt(util.xor(data1,
                    ezeros))) || Pkx.verifyChk(Pkx.decrypt(util.xor(data1,
                        this.key.blank))));
                keydata2 = (Pkx.verifyChk(Pkx.decrypt(data2)) || Pkx.verifyChk(Pkx.decrypt(util.xor(data2,
                    ezeros))) || Pkx.verifyChk(Pkx.decrypt(util.xor(data2,
                        this.key.blank))));

                var emptyKey, emptyKeyData;
                var emptyOffset;

                if (keydata1 && keydata2) {
                    // Save file is currently empty...
                    // Copy key data from save file if it decrypts with Key1 data properly.
                    emptyKey = this.sav;
                    emptyOffset = savOffset;
                    emptyKeyData = data1;
                } else if (keydata1) { // Key 1 is empty
                    emptyKey = this.key.boxKey1;
                    emptyOffset = keyOffset;
                    emptyKeyData = data1;
                } else if (keydata2) { // Key 2 is emtpy
                    emptyKey = this.key.boxKey2;
                    emptyOffset = keyOffset;
                    emptyKeyData = data2;
                } else
                    return [undefined, false]; // All three are occupied

                if (Pkx.verifyChk(Pkx.decrypt(emptyKeyData))) {
                    // No modifications necessary.
                    ekx = emptyKeyData;
                    util.copy(emptyKey, emptyOffset, this.key.boxKey2, keyOffset,
                        232);
                    util.copy(zeros, 0, this.key.boxKey1, keyOffset, 232);
                }
                else if (Pkx.verifyChk(Pkx.decrypt(util.xor(emptyKeyData, ezeros)))) {
                    ekx = ezeros;
                    util.xor(ezeros, 0, emptyKey, emptyOffset, this.key.boxKey2, keyOffset, 232);
                    util.copy(zeros, 0, this.key.boxKey1, keyOffset, 232);
                } else if (Pkx.verifyChk(Pkx.decrypt(util.xor(emptyKeyData,
                    this.key.blank)))) {
                    ekx = ezeros;
                    util.xor(this.key.blank, 0, emptyKey, emptyOffset,
                        this.key.boxKey2, keyOffset, 232);
                    util.copy(zeros, 0, this.key.boxKey1, keyOffset,
                        232);
                }
            }
        }
        var pkx = Pkx.decrypt(ekx);
        if (Pkx.verifyChk(pkx)) {
            return [pkx, ghost];
        } else
            return [undefined, false]; // Slot Decryption error?!
    }
}
