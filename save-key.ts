"use strict";

import PkBase from "./pkbase";
import * as util from "./util";
import { eggnames } from "./save-breaker";
import SaveReaderEncrypted from "./save-reader-encrypted";

export default class SaveKey {
    public boxKey1: Uint8Array;
    private _blank: Uint8Array;
    public boxKey2: Uint8Array;
    public slot1Key: Uint8Array;

    private key32: Uint32Array;

    get keyData() {
        return this.key;
    }

    get blank(): Uint8Array {
        return this._blank;
    }

    set blank(val: Uint8Array) {
        util.copy(val, 0, this._blank, 0, 232);
    }

    get stamp(): string {
        return util.getStampSav(this.key, 0);
    }

    get boxOffset(): number {
        return this.key32[0x1C / 4];
    }

    set boxOffset(val: number) {
        this.key32[0x1C / 4] = val;
    }

    get slot1Flag(): number {
        return this.key32[0x80000 / 4];
    }

    set slot1Flag(val: number) {
        this.key32[0x80000 / 4] = val;
    }

    private get magic(): number {
        return this.key32[2];
    }

    private set magic(val: number) {
        this.key32[2] = val;
    }

    public get isNewKey(): boolean {
        return !this.slot1Key.every(e => e == 0);
    }

    public setStamp(save: Uint8Array) {
        util.copy(save, 0x10, this.key, 0x0, 0x8);
    }

    public get slotsUnlocked(): boolean[] {
        var res = [];
        for (var i = 0; i < 930; ++i) {
            res.push(util.empty(this.boxKey1, i * 232, 232) && !util.empty(this.boxKey2, i * 232, 232))
        }
        return res;
    }

    public mergeKey(other: SaveKey) {
        // upgrade to a new style key if possible
        if (!this.isNewKey && other.isNewKey) {
            util.copy(other.slot1Key, 0, this.slot1Key, 0, 0x34AD0);
        }
        for (var i = 0; i < 930; ++i) {
            // this means our key is not complete for this slot
            if (!util.empty(this.boxKey1, i * 232, 232) || util.empty(this.boxKey2, i * 232, 232)) {
                // this slot is complete for the other key, just copy it
                if (util.empty(other.boxKey1, i * 232, 232) && !util.empty(other.boxKey2, i * 232, 232)) {
                    util.copy(other.boxKey1, i * 232, this.boxKey1, i * 232, 232);
                    util.copy(other.boxKey2, i * 232, this.boxKey2, i * 232, 232);
                    continue;
                }

                if (!util.empty(other.boxKey1, i * 232, 232))
                    SaveReaderEncrypted.getPkxRaw(other.boxKey1, i, this);
                if (!util.empty(other.boxKey2, i * 232, 232))
                    SaveReaderEncrypted.getPkxRaw(other.boxKey2, i, this);
            }
        }
    }

    constructor(private key: Uint8Array) {
        this.key32 = new Uint32Array(key.buffer, key.byteOffset, 0x2D2B5);
        this.boxKey1 = key.subarray(0x100, 0x34BD0);
        this._blank = key.subarray(0x34BD0, 0x34BD0 + 0xE8);
        this.boxKey2 = key.subarray(0x40000, 0x40000 + 0x34AD0);
        this.slot1Key = key.subarray(0x80004, 0x80004 + 0x34AD0);
        if (this.magic != 0x42454546 )
        {
            this.magic = 0x42454546;

            if (!util.empty(key, 0x10, 0x4)) {
                this._blank.fill(0);
                util.copy(key, 0x10, this._blank, 0xE0, 0x4);
                var nicknameBytes = util.encodeUnicode16LE(eggnames[this._blank[0xE3] - 1]);
                util.copy(nicknameBytes, 0, this._blank, 0x40, nicknameBytes.length);
                PkBase.fixChk(this._blank);
                util.copy(PkBase.encrypt(this._blank), 0, this._blank, 0, 232);
            }
        }
    }

}
