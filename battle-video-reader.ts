"use strict";
import PkBase from "./pkbase";
import * as util from "./util";
import BattleVideoKey from "./battle-video-key";

export default class BattleVideoReader {
    private static myTeamOffset = 0x4E18;
    private static opponentTeamOffset = 0x5438;

    constructor(private video: Uint8Array, private key: BattleVideoKey) {}

    get dumpsOpponent() {
        return this.key.dumpsOpponent;
    }

    getPkx(slot: number, isOpponent: boolean): PkBase {
        var ekx, pkx;
        if (isOpponent) {
            if (!this.dumpsOpponent)
                return undefined;
            ekx = util.xor(this.video, BattleVideoReader.opponentTeamOffset + 260 * slot, this.key.opponentTeamKey, 260 * slot, 260);
        } else {
            ekx = util.xor(this.video, BattleVideoReader.myTeamOffset + 260 * slot, this.key.myTeamKey, 260 * slot, 260);
        }
        pkx = PkBase.decrypt(ekx);
        if ( !PkBase.verifyChk(pkx) || util.empty(pkx)) {
            return undefined;
        }
        return PkBase.makePkm(pkx, 6, -1, slot, false);
    }

    getAllPkx() {
        var myTeam = [];
        var tmp;
        for (var i = 0; i < 6; ++i) {
            tmp = this.getPkx(i, false);
            if (tmp === undefined)
                break;
            myTeam.push(tmp);
        }
        var opponentTeam = undefined;
        if (this.dumpsOpponent) {
            opponentTeam = [];
            for (var i = 0; i < 6; ++i) {
                tmp = this.getPkx(i, true);
                if (tmp === undefined)
                    break;
                opponentTeam.push(tmp);
            }
        }
        return {
            myTeam,
            opponentTeam
        };
    }
}
