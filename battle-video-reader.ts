"use strict";
import Pkx from "./pkx";
import * as util from "./util";
import BattleVideoKey from "./battle-video-key";

export default class BattleVideoReader {
    private static myTeamOffset = 0x4E18;
    private static opponentTeamOffset = 0x5438;

    constructor(private video: Uint8Array, private key: BattleVideoKey) {}

    get dumpsEnemy() {
        return (this.key[0x800] | this.key[0x801] | this.key[0x802] | this.key[0x803]
              | this.key[0x804] | this.key[0x805] | this.key[0x806] | this.key[0x807]) != 0;
    }

    getPkx(slot: number, isOpponent: boolean): Pkx {
        var ekx, pkx;
        if (isOpponent) {
            if (!this.dumpsEnemy)
                return undefined;
            ekx = util.xor(this.video, BattleVideoReader.opponentTeamOffset + 260 * slot, this.key.opponentTeamKey, 260 * slot, 260);
        } else {
            ekx = util.xor(this.video, BattleVideoReader.myTeamOffset + 260 * slot, this.key.myTeamKey, 260 * slot, 260);
        }
        pkx = Pkx.decrypt(ekx);
        if ( !Pkx.verifyChk(pkx) || pkx.every(e => e == 0)) {
            return undefined;
        }
        return new Pkx(pkx, -1, slot, false);
    }
}
