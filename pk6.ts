"use strict";

import * as util from "./util";
import PkBase from "./pkbase";

export default class Pk6 extends PkBase {
    // Uints
    public trainingBagHitsRemaining: number;

    constructor(pkx: Uint8Array, box: number, slot: number, isGhost: boolean) {
        super(pkx, box, slot, isGhost);

        this.version = 6;

        const data: DataView = util.createDataView(pkx);

        this.trainingBagHitsRemaining = data.getUint16(0x16, true);
        this.markings = pkx[0x2a];

        // TODO dump EVERYTHING
        // TODO 0x72 - Super Training Flag - Passed with pkx to new form
    }
}
