"use strict";

import SaveReader from "./save-reader";
import PkBase from "./pkbase";
import * as util from "./util";

const orasOffset = 0x33000;
const xyOffset = 0x22600;
const xyRamsavOffset = 0x1EF38;
const orasRamsavOffset = 0x2F794;
const smOffset = 0x04E00;

export { default as SaveReader } from "./save-reader";
export default class SaveReaderDecrypted implements SaveReader {
    private offset: number;
    public version: number;

    get keyName() {
        return "Decrypted. No key needed.";
    }

    get unlockedSlots() {
        return 930;
    }

    get isNewKey() {
        return true;
    }

    scanSlots(from?: number, to?: number) {}

    constructor(private sav: Uint8Array, type: string) {
        switch (type) {
        case "XY":
            this.offset = xyOffset;
            this.version = 6;
            break;
        case "ORAS":
            this.offset = orasOffset;
            this.version = 6;
            break;
        case "YABD":
            this.version = 6;
            this.offset = 4;
            var ekx = sav.subarray(4, 236);
            if (!PkBase.verifyChk(PkBase.decrypt(ekx)))
                this.offset = 8;
            break;
        case "PCDATA":
            this.version = 6;
            this.offset = 0;
            break;
        case "XYRAM":
            this.version = 6;
            this.offset = xyRamsavOffset;
            break;
        case "ORASRAM":
            this.version = 6;
            this.offset = orasRamsavOffset;
            break;
        case "SM":
            this.version = 7;
            this.offset = smOffset;
            break;
        }
    }

    getPkx(pos: number): PkBase {
        var pkxOffset = this.offset + pos * 232;
        var pkx = this.sav.subarray(pkxOffset, pkxOffset + 232);
        if (util.empty(pkx))
            return undefined;
        pkx = PkBase.decrypt(pkx);
        if (PkBase.verifyChk(pkx) && (pkx[8] | pkx[9]) != 0) {
            return PkBase.makePkm(pkx, this.version, Math.floor(pos / 30), pos % 30, false);
        }
        return undefined;
    }

    getAllPkx() {
        var res = [];
        var tmp;
        for (var i = 0; i < 930; ++i) {
            tmp = this.getPkx(i);
            if (tmp !== undefined) {
                res.push(tmp);
            }
        }
        return res;
    }
}
