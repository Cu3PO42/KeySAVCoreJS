import * as util from "./util";
import PkBase, { registerPkmImpl } from "./pkbase";

/**2yj
 * The generation 6 specialization of a Pokémon.
 */
export default class Pk6 extends PkBase {
  // Uints
  public trainingBagHitsRemaining: number;
  public superTrainingFlag: number;

  /**
   * Construct a new Pk6 representation.
   *
   * @param pkx The raw Pk6 data.
   * @param box The box the Pokémon is located in.
   * @param slot The slot in the box the Pokémon is located in.
   * @param isGhost True if the Pokémon might be an artifact of bad decryption
   */
  constructor(pkx: Uint8Array, box: number, slot: number, isGhost: boolean) {
    super(pkx, box, slot, isGhost);

    this.version = 6;

    const data: DataView = util.createDataView(pkx);

    this.trainingBagHitsRemaining = data.getUint16(0x16, true);
    this.markings = pkx[0x2a];
    this.superTrainingFlag = pkx[0x72];
  }
}

registerPkmImpl(6, Pk6);
