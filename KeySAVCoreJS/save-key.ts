import Pkx from "./pkx";
import * as util from "./util";
import { eggnames } from "./save-breaker";

export default class SaveKey {
    public location: Uint8Array;
    public boxKey1: Uint8Array;
    public blank: Uint8Array;
    public slotsUnlocked: Uint8Array;
    public boxKey2: Uint8Array;
    public slot1Key: Uint8Array;

    private key32: Uint32Array;

    get stamp1(): [number, number] {
        return [this.key32[0], this.key32[1]];
    }

    set stamp1([val1, val2]: [number, number]) {
        this.key32[0] = val1;
        this.key32[1] = val2;
    }

    get boxOffset(): number {
        return this.key32[0x1C / 4];
    }

    set boxOffset(val: number) {
        this.key32[0x1C / 4] = val;
    }

    get slot1Flag(): number {
        return this.key32[0x80000 / 4];
    }

    set slot1Flag(val: number) {
        this.key32[0x80000 / 4];
    }

    private get magic(): number {
        return this.key32[2];
    }

    private set magic(val: number) {
        this.key32[2] = val;
    }

    public get isNewKey(): boolean {
        return !this.slot1Key.every(e => e == 0);
    }

    constructor(private key: Uint8Array) {
        this.key32 = new Uint32Array(key.buffer, key.byteOffset, 0x2D2B5);
        this.location = key.subarray(0x10, 0x14);
        this.boxKey1 = key.subarray(0x100, 0x34BD0);
        this.blank = key.subarray(0x34BD0, 0x34BD0 + 0xE8);
        this.slotsUnlocked = key.subarray(0x34CB8, 0x34CB8 + 0x3A2);
        this.boxKey2 = key.subarray(0x40000, 0x40000 + 0x34AD0);
        this.slot1Key = key.subarray(0x80004, 0x80004 + 0x34AD0);
        if (this.magic != 0x42454546)
        {
            this.magic = 0x42454546;
            this.blank.fill(0);
            util.copy(this.location, 0, this.blank, 0xE0, 0x4);
            var nicknamebytes = util.encodeUnicode16LE(eggnames[this.blank[0xE3] - 1]);
            util.copy(nicknamebytes, 0, this.blank, 0x40, nicknamebytes.length > 24 ? 24 : nicknamebytes.length);

            var blank16 = new Uint16Array(this.blank.buffer, this.blank.byteOffset, 0xE8/2);
            var chk = 0;
            for (let i = 4; i < 232/2; i++)
                chk += blank16[i];

            blank16[3] = chk;
            util.copy(Pkx.encrypt(this.blank), 0, this.blank, 0, 232);

            for (let i = 0; i < 930; ++i)
                this.slotsUnlocked[i] = util.empty(this.boxKey1, i*232, 232) ? 1 : 0;
        }
    }

}