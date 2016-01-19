import SaveReader from "./save-reader";
import Pkx from "./pkx";
import * as util from "./util";

const orasOffset = 0x33000;
const xyOffset = 0x22600;
const xyRamsavOffset = 0x1EF38;
const orasRamsavOffset = 0x2F794;

export { default as SaveReader } from "./save-reader";
export default class SaveReaderDecrypted implements SaveReader {
    private offset: number;

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
            break;
        case "ORAS":
            this.offset = orasOffset;
            break;
        case "YABD":
            this.offset = 4;
            var ekx = sav.subarray(4, 236);
            if (!Pkx.verifyChk(Pkx.decrypt(ekx)))
                this.offset = 8;
            break;
        case "PCDATA":
            this.offset = 0;
            break;
        case "XYRAM":
            this.offset = xyRamsavOffset;
            break;
        case "ORASRAM":
            this.offset = orasRamsavOffset;
            break;
        }
    }

    getPkx(pos: number): Pkx {
        var pkxOffset = this.offset + pos * 232;
        var pkx = this.sav.subarray(pkxOffset, pkxOffset + 232);
        if (util.empty(pkx))
            return null;
        pkx = Pkx.decrypt(pkx);
        if (Pkx.verifyChk(pkx) && (pkx[8] | pkx[9]) != 0) {
            return new Pkx(pkx, pos / 30, pos % 30, false);
        }
        return undefined;
    }
}
