import { getStampBv, empty, copy } from "./util";

export default class BattleVideoKey {
    get stamp(): string {
        return getStampBv(this.keyData, 0);
    }

    get dumpsEnemy(): boolean {
        return !empty(this.opponentTeamKey);
    }

    public stampRaw: Uint8Array;
    public myTeamKey: Uint8Array;
    public opponentTeamKey: Uint8Array;

    constructor(public keyData: Uint8Array) {
        this.stampRaw = this.keyData.subarray(0, 0x10);
        this.myTeamKey = this.keyData.subarray(0x100, 0x100+260*6);
        this.opponentTeamKey = this.keyData.subarray(0x800, 0x800+260*6);
    }

    mergeKey(other: BattleVideoKey) {
        if (!this.dumpsEnemy && other.dumpsEnemy) {
            copy(other.opponentTeamKey, 0, this.opponentTeamKey, 0, 260*6);
        }
    }
}
