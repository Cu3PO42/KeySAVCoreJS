"use strict";
import PkBase from "./pkbase";
import * as util from "./util";
import BattleVideoKey from "./battle-video-key";

export default class BattleVideoReader {
    public version: number;

    constructor(private video: Uint8Array, private key: BattleVideoKey) {
        this.version = BattleVideoReader.getGeneration(video);
    }

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

    public static getOffsets(generation: number) {
        return {
            6: {
                myParty: 0x4e18,
                opponentParty: 0x5438
            },
            7: {
                myParty: 0x4e41,
                opponentParty: 0x545e
            }
        }[generation];
    }

    get dumpsOpponent() {
        return this.key.dumpsOpponent;
    }

    getPkx(slot: number, isOpponent: boolean): PkBase {
        const offsets = BattleVideoReader.getOffsets(this.version);

        var ekx, pkx;
        if (isOpponent) {
            if (!this.dumpsOpponent)
                return undefined;
            ekx = util.xor(this.video, offsets.opponentParty + 260 * slot, this.key.opponentTeamKey, 260 * slot, 260);
        } else {
            ekx = util.xor(this.video, offsets.myParty + 260 * slot, this.key.myTeamKey, 260 * slot, 260);

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
