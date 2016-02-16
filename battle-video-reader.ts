"use strict";
import Pkx from "./pkx";
import * as util from "./util";
import BattleVideoKey from "./battle-video-key";

export default class BattleVideoReader {
    private static myTeamOffset = 0x4E18;
    private static opponentTeamOffset = 0x5438;

    constructor(private video: Uint8Array, private key: BattleVideoKey) {}

    get dumpsEnemy() {
        return this.key.dumpsEnemy;
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
        if ( !Pkx.verifyChk(pkx) || util.empty(pkx)) {
            return undefined;
        }
        return new Pkx(pkx, -1, slot, false);
    }
}
