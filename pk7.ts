import PkBase, { registerPkmImpl } from "./pkbase";
import * as util from "./util";

/**
 * The list of all form names in generation 6, ordered by species, then form ID.
 */
export default class Pk7 extends PkBase {
    /**
     * The TID that is shown in Generation 7 games.
     */
    public tid7: number;

    /**
     * Construct a new Pk7 representation.
     * 
     * @param pkx The raw Pk7 data.
     * @param box The box the Pokémon is located in.
     * @param slot The slot in the box the Pokémon is located in.
     * @param isGhost True if the Pokémon might be an artifact of bad decryption
     */
    constructor(pkx: Uint8Array, box: number, slot: number, isGhost: boolean) {
        super(pkx, box, slot, isGhost);

        this.version = 7;

        const data: DataView = util.createDataView(pkx);

        this.markings = data.getUint16(0x16, true);
        this.tid7 = data.getUint32(0x0C, true) % 1000000;
    }
}

registerPkmImpl(7, Pk7);
