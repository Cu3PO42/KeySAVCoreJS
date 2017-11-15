import SaveReader from "./save-reader";
import PkBase from "./pkbase";
import * as util from "./util";

const orasOffset = 0x33000;
const xyOffset = 0x22600;
const xyRamsavOffset = 0x1EF38;
const orasRamsavOffset = 0x2F794;
const smOffset = 0x04E00;
const usumOffset = 0x05200;

export { default as SaveReader } from "./save-reader";

/**
 * An implementation of [[SaveReader]] for unencrypted saves.
 */
export default class SaveReaderDecrypted implements SaveReader {
    private offset: number;
    public generation: number;

    get keyName() {
        return "Decrypted. No key needed.";
    }

    get unlockedSlots() {
        return this.generation === 6 ? 930 : 960;
    }

    get isNewKey() {
        return true;
    }

    scanSlots(from?: number, to?: number) {}

    constructor(private sav: Uint8Array, type: string) {
        switch (type) {
        case "XY":
            this.offset = xyOffset;
            this.generation = 6;
            break;
        case "ORAS":
            this.offset = orasOffset;
            this.generation = 6;
            break;
        case "YABD":
            this.generation = 6;
            this.offset = 4;
            let ekx = sav.subarray(4, 236);
            if (PkBase.verifyChk(PkBase.decrypt(ekx)))
                break;

            this.offset = 8;
            ekx = sav.subarray(8, 240);
            if (PkBase.verifyChk(PkBase.decrypt(ekx)))
                break;

            this.generation = 7;
            this.offset = 0;
            break;
        case "PCDATA":
            this.generation = 6;
            this.offset = 0;
            break;
        case "XYRAM":
            this.generation = 6;
            this.offset = xyRamsavOffset;
            break;
        case "ORASRAM":
            this.generation = 6;
            this.offset = orasRamsavOffset;
            break;
        case "SM":
            this.generation = 7;
            this.offset = smOffset;
            break;
        case "USUM":
            this.generation = 7;
            this.offset = usumOffset;
        }
    }

    getPkx(pos: number): PkBase {
        var pkxOffset = this.offset + pos * 232;
        var pkx = this.sav.subarray(pkxOffset, pkxOffset + 232);
        if (util.empty(pkx))
            return undefined;
        pkx = PkBase.decrypt(pkx);
        if (PkBase.verifyChk(pkx) && (pkx[8] | pkx[9]) != 0) {
            return PkBase.makePkm(pkx, this.generation, Math.floor(pos / 30), pos % 30, false);
        }
        return undefined;
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
}
