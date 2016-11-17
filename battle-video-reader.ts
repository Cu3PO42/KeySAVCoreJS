import PkBase from "./pkbase";
import * as util from "./util";
import BattleVideoKey from "./battle-video-key";

export default class BattleVideoReader {
    public version: number;
    private _offsets: { partyOffsets: number[] };

    constructor(private video: Uint8Array, private key: BattleVideoKey) {
        this.version = BattleVideoReader.getGeneration(video);
        this._offsets = BattleVideoReader.getOffsets(this.version);
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
                partyOffsets: [0x4e18, 0x5438]
            },
            7: {
                partyOffsets: [0x4e41, 0x545e, 0x5a7b, 0x6098]
            }
        }[generation];
    }

    get workingKeys() {
        return this.key.workingKeys;
    }

    getPkx(slot: number, team: number): PkBase {
        const ekx = util.xor(this.video, this._offsets.partyOffsets[team] + 260 * slot, this.key.teamKeys[team], 260 * slot, 260);
        const pkx = PkBase.decrypt(ekx);
        if ( !PkBase.verifyChk(pkx) || util.empty(pkx)) {
            return undefined;
        }

        return PkBase.makePkm(pkx, 6, -1, slot, false);
    }

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
