import PkBase, { registerPkmImpl } from "./pkbase";
import * as util from "./util";

export default class Pk7 extends PkBase {
    public tid7: number;

    constructor(pkx: Uint8Array, box: number, slot: number, isGhost: boolean) {
        super(pkx, box, slot, isGhost);

        this.version = 7;

        const data: DataView = util.createDataView(pkx);

        this.markings = data.getUint16(0x16, true);
        this.tid7 = data.getUint32(0x0C, true) % 1000000;
    }
}

registerPkmImpl(7, Pk7);
