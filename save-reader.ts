"use strict";

import Pkx from "./pkx";

interface SaveReader {
    unlockedSlots: number;
    isNewKey: boolean;
    scanSlots(from: number, to: number);
    scanSlots(slot: number);
    scanSlots();
    getPkx(pos: number): Pkx;
    getAllPkx(): Pkx[];
}

export default SaveReader;
