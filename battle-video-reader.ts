import PkBase from "./pkbase";
import * as util from "./util";
import BattleVideoKey from "./battle-video-key";

/**
 * A class to allow accessing the teams stored in a battle video with the appropriate key.
 */
export default class BattleVideoReader {
  /**
   * The generation this battle video is from.
   */
  public generation: number;
  private _offsets: { partyOffsets: number[] };

  /**
   * The raw battle video data this reader is accessing.
   */
  public get video() {
    return this._video;
  }

  /**
   * Create a new reader for a battle video with the provided key.
   *
   * @param _video The battle video to be accessed
   * @param key The key for the relevant battle video slot
   */
  constructor(private _video: Uint8Array, private key: BattleVideoKey) {
    this.generation = BattleVideoReader.getGeneration(_video);
    this._offsets = BattleVideoReader.getOffsets(this.generation);
  }

  /**
   * Get the generation a battle video is from.
   *
   * @param video The battle video to check
   * @return The generation
   */
  public static getGeneration(video: Uint8Array) {
    switch (video.length) {
      case 0x6e60:
        return 6;
      case 0x6bc0:
        return 7;
      default:
        return -1;
    }
  }

  /**
   * Get the offsets the parties are stored at in a battle video in a given generation.
   *
   * @param generation The generation for which to retrieve the offsets
   * @return The relevant offsets
   */
  public static getOffsets(generation: number) {
    return {
      6: {
        partyOffsets: [0x4e18, 0x5438],
      },
      7: {
        partyOffsets: [0x4e41, 0x545e, 0x5a7b, 0x6098],
      },
    }[generation];
  }

  /**
   * Get an array of flags indicating which parties are readable with the given key.
   */
  get workingKeys() {
    return this.key.workingKeys;
  }

  /**
   * Read any Pokémon from the battle video. If the slot cannot be decrypted or there is no Pokémon there,
   * return undefined.
   *
   * @param slot The Pokémons position in the team
   * @param team The number of the team the Pokémon is in
   */
  getPkx(slot: number, team: number): PkBase {
    const ekx = util.xor(
      this._video,
      this._offsets.partyOffsets[team] + 260 * slot,
      this.key.teamKeys[team],
      260 * slot,
      260
    );
    const pkx = PkBase.decrypt(ekx);
    if (!PkBase.verifyChk(pkx) || util.empty(pkx)) {
      return undefined;
    }

    return PkBase.makePkm(pkx, this.key.generation, -1, slot, false);
  }

  /**
   * Get all Pokémon that can be decrypted from this battle video.
   */
  getAllPkx() {
    const res = [];
    for (let i = 0; i < this.key.teamKeys.length; ++i) {
      const team = [];
      res.push(team);
      for (let j = 0; j < 6; ++j) {
        const tmp = this.getPkx(j, i);
        if (tmp === undefined) break;
        team.push(tmp);
      }
    }
    return res;
  }
}
