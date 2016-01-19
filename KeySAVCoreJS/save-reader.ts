import Pkx from "./pkx";

interface SaveReader {
    keyName: string;
    unlockedSlots: number;
    isNewKey: boolean;
    scanSlots(from: number, to: number);
    scanSlots(slot: number);
    scanSlots();
    getPkx(pos: number): Pkx;
}

export default SaveReader;