import SaveReader from "./save-reader";
import SaveKey from "./save-key";
import PkBase from "./pkbase";
import * as util from "./util";

var zeros = new Uint8Array(232);
var ezeros = PkBase.encrypt(zeros);

export { default as SaveReader } from "./save-reader";
export default class SaveReaderEncrypted implements SaveReader {
    public static getOffsets(generation: number) {
        return {
            6: {
                fileSize: 0x100000,
                saveSize: 0x07f000,
                base1: 0x1000,
                base2: 0x080000
            },
            7: {
                fileSize: 0x0fe000,
                saveSize: 0x07e000,
                base1: 0x2000,
                base2: 0x080000
            }
        }[generation];
    }

    public static getGeneration(file: Uint8Array) {
        let length = file.length;
        if (length === 0x100000 || length === 0x10009C || length === 0x10019A) {
            return 6;
        }
        if (length === 0x0fe000 || length === 0x0fe09c || length === 0x0fe19a) {
            return 7;
        }
        return -1;
    }

    private activeSlot: number;
    private boxes1: Uint8Array;
    private boxes2: Uint8Array;

    public get generation() {
        return this.key.generation;
    }

    get unlockedSlots() {
        var res = 0;
        for (var i = 0; i < this.key.slotsUnlocked.length; ++i)
            if (this.key.slotsUnlocked[i])
                ++res;
        return res;
    }

    get isNewKey() {
        return this.key.isNewKey;
    }

    constructor(private sav: Uint8Array, private key: SaveKey) {
        const offsets = SaveReaderEncrypted.getOffsets(this.generation);

        this.sav = this.sav.subarray(this.sav.length % offsets.fileSize);
        this.activeSlot = this.key.slot1Flag == util.createDataView(sav).getUint32(0x168, true) && this.key.isNewKey ? 0 : 1;
        this.boxes1 = util.xor(this.sav, key.boxOffset - offsets.saveSize, key.slot1Key, 0, 232 * 30 * (this.generation === 6 ? 31 : 32));
        this.boxes2 = this.sav.subarray(key.boxOffset, key.boxOffset + 232 * 30 * (this.generation === 6 ? 31 : 31));
    }

    scanSlots(pos1?: number, pos2?: number) {
        if (Number.isInteger(pos1)) {
            if (!Number.isInteger(pos2)) {
                pos2 = pos1;
            }
        } else {
            pos1 = 0;
            pos2 = (this.generation=== 6 ? 31 : 32) * 30;

        }

        if (this.key.isNewKey) {
            for (let i = pos1; i < pos2; ++i) {
                SaveReaderEncrypted.getPkxRaw(this.boxes1, i, this.key);
                SaveReaderEncrypted.getPkxRaw(this.boxes2, i, this.key);
            }
        } else {
            for (let i = pos1; i < pos2; ++i) {
                SaveReaderEncrypted.getPkxRaw(this.boxes2, i, this.key);
            }
        }
    }

    getPkx(pos: number): PkBase {
        var res = SaveReaderEncrypted.getPkxRaw(this.activeSlot === 0 ? this.boxes1 : this.boxes2, pos, this.key), data = res[0], ghost = res[1];
        if (data === undefined || (data[8] | data[9]) == 0)
            return undefined;
        return PkBase.makePkm(data, this.generation, (pos / 30) | 0, pos % 30, ghost);
    }

    getAllPkx() {
        var res = [];
        var tmp;
        for (var i = 0; i < (this.generation === 6 ? 930 : 960); ++i) {
            tmp = this.getPkx(i);
            if (tmp !== undefined) {
                res.push(tmp);
            }
        }
        return res;
    }

    public static getPkxRaw(boxes: Uint8Array, pos: number, key: SaveKey): [Uint8Array, boolean] {
        // Auto updates the keystream when it dumps important data!
        var pkx: Uint8Array;

        const offset = pos * 232;

        if (util.empty(key.boxKey1, offset, 232)) {
            if (util.empty(key.boxKey2, offset, 232)) {
                // We don't have any data for this slot
                util.copy(boxes, offset, key.boxKey1, offset, 232);
                return [undefined, false];
            }

            // We have a key2 only, this is supposed to be the actual key
            pkx = PkBase.decrypt(util.xor(key.boxKey2, offset, boxes, offset, 232));
            if (PkBase.verifyChk(pkx)) {
                return [pkx, false];
            } else {
                // Something is wrong. Our data didn't decrypt properly. Apparently the key is wrong.
                util.copy(zeros, 0, key.boxKey2, offset, 232);
                return [undefined, false];
            }
        }

        var data1 = util.xor(boxes, offset, key.boxKey1, offset, 232);
        var data2 = util.xor(boxes, offset, key.boxKey2, offset, 232);
        var possibleExtraKeys = [zeros, ezeros, key.blank];
        var possibleEkx1 = possibleExtraKeys.map((e) => util.xor(data1, e));
        var possibleEkx2 = possibleExtraKeys.map((e) => util.xor(data2, e));

        function tryDecrypt(possibleEkx: Uint8Array[], sourceKey: Uint8Array, sourceOffset: number, destinationKey: Uint8Array): [Uint8Array, boolean] {
            var pkx: Uint8Array;
            for (var i = 0; i < possibleExtraKeys.length; ++i) {
                pkx = PkBase.decrypt(possibleEkx[i]);
                if (PkBase.verifyChk(pkx)) {
                    util.xor(possibleExtraKeys[i], 0, sourceKey, sourceOffset, destinationKey, offset, 232);
                    return [pkx, true];
                }
            }

            return [undefined, false];
        }

        if (util.empty(key.boxKey2, offset, 232)) {
            if (possibleEkx1.some(util.empty)) {
                // Slot hasn't changed.
                return [undefined, false];
            }

            return tryDecrypt(possibleEkx1, boxes, offset, key.boxKey2);
        }

        if (possibleEkx1.some(util.empty)) {
            // Save  is the same as key 1
            return tryDecrypt(possibleEkx2, key.boxKey2, offset, key.boxKey2);
        }

        if (possibleEkx2.some(util.empty)) {
            // Save is the same as key 2
            return tryDecrypt(possibleEkx1, key.boxKey1, offset, key.boxKey1);
        }

        // Data has been observed to change twice! We can potentially get our exact keystream now!
        // Either key1 or key2 or save would be empty.
        for (let possibleEkx of possibleEkx1) {
            pkx = PkBase.decrypt(possibleEkx);
            if (!PkBase.verifyChk(pkx)) {
                continue;
            }

            if (possibleEkx2.some((e) => PkBase.verifyChk(PkBase.decrypt(e)))) {
                // Save file is empty
                util.xor(possibleEkx, 0, key.boxKey1, offset, key.boxKey2, offset, 232);
            } else {
                // Key 1 is empty
                util.xor(possibleEkx, 0, boxes, offset, key.boxKey2, offset, 232);
            }

            util.copy(zeros, 0, key.boxKey1, offset, 232);
            return [pkx, false];
        }

        for (let possibleEkx of possibleEkx2) {
            pkx = PkBase.decrypt(possibleEkx);
            if (!PkBase.verifyChk(pkx)) {
                continue;
            }

            // Key 2 is empty
            util.xor(possibleEkx, 0, boxes, offset, key.boxKey2, offset, 232);
            util.copy(zeros, 0, key.boxKey1, offset, 232);
            return [pkx, false];
        }

        // None of the three files are empty
        return [undefined, false];
    }
}
