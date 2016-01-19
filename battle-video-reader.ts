import Pkx from "./pkx";
import * as util from "./util";

export default class BattleVideoReader {
    private static offset = 0x4E18;
    private static keyoff = 0x100;

    constructor(private video: Uint8Array, private key: Uint8Array) {}

    get dumpsEnemy() {
        return (this.key[0x800] | this.key[0x801] | this.key[0x802] | this.key[0x803]
              | this.key[0x804] | this.key[0x805] | this.key[0x806] | this.key[0x807]) != 0;
    }

    getPkx(slot: number, isOpponent: boolean): Pkx {
        var ekx;
        var pkx;
        var opponent: number = isOpponent ? 1 : 0;
        ekx = util.xor(this.video, BattleVideoReader.offset + 260 * slot + opponent * 1568,
            this.key, BattleVideoReader.keyoff + 260 * slot + opponent * 1792, 260);
        pkx = Pkx.decrypt(ekx);
        if (pkx.every(e => e == 0)) {
            return undefined;
        }
        return new Pkx(Pkx.verifyChk(pkx) ? pkx : ekx, -1, slot, false);
        }
}