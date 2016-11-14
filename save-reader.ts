"use strict";

import PkBase from "./pkbase";

interface SaveReader {
    unlockedSlots: number;
    isNewKey: boolean;
    version: number;
    scanSlots(from: number, to: number);
    scanSlots(slot: number);
    scanSlots();
    getPkx(pos: number): PkBase;
    getAllPkx(): PkBase[];
}

export default SaveReader;
