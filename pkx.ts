"use strict";

import * as util from "./util";
import * as LCRNG from "./lcrng";

export default class Pkx {
    // Uints
    public ec: number;
    public pid: number;
    public exp: number;
    public evHp: number;
    public evAtk: number;
    public evDef: number;
    public evSpAtk: number;
    public evSpDef: number;
    public evSpe: number;
    public ivHp: number;
    public ivAtk: number;
    public ivDef: number;
    public ivSpe: number;
    public ivSpAtk: number;
    public ivSpDef: number;
    public contestStatCool: number;
    public contestStatBeauty: number;
    public contestStatCute: number;
    public contestStatSmart: number;
    public contestStatTough: number;
    public contestStatSheen: number;
    public markings: number;
    public hpType: number;

    // Ints
    public pkrsStrain: number;
    public pkrsDuration: number;
    public levelMet: number;
    public otGender: number;

    // Ushorts
    public ability: number;
    public abilityNum: number;
    public nature: number;
    public species: number;
    public heldItem: number;
    public tid: number;
    public sid: number;
    public tsv: number;
    public esv: number;
    public move1: number;
    public move2: number;
    public move3: number;
    public move4: number;
    public move1Pp: number;
    public move2Pp: number;
    public move3Pp: number;
    public move4Pp: number;
    public move1Ppu: number;
    public move2Ppu: number;
    public move3Ppu: number;
    public move4Ppu: number;
    public eggMove1: number;
    public eggMove2: number;
    public eggMove3: number;
    public eggMove4: number;
    public ribbonSet1: number;
    public ribbonSet2: number;
    public chk: number;
    public otFriendship: number;
    public otAffection: number;
    public eggLocation: number;
    public metLocation: number;
    public ball: number;
    public encounterType: number;
    public gameVersion: number;
    public countryID: number;
    public regionID: number;
    public dsregID: number;
    public otLang: number;

    // Shorts
    public box: number;
    public slot: number;

    // Bytes
    public ribbonSet3: number;
    public ribbonSet4: number;
    public form: number;
    public gender: number;

    // Longs
    public metDate: number;
    public eggDate: number;

    public isEgg: boolean;
    public isNick: boolean;
    public isShiny: boolean;
    public isGhost: boolean;
    public isFatefulEncounter: boolean;

    public data: number[];

    public nickname: string;
    public notOT: string;
    public ot: string;

    constructor(pkx: Uint8Array, box: number, slot: number, isGhost: boolean) {
        this.data = Array.from(pkx);
        this.box = box;
        this.slot = slot;
        this.isGhost = isGhost;

        var data: DataView = new DataView(pkx.buffer);

        this.ec = data.getUint32(0, true);
        this.chk = data.getUint16(6, true);
        this.species = data.getUint16(8, true);
        this.heldItem = data.getUint16(10, true);
        this.tid = data.getUint16(12, true);
        this.sid = data.getUint16(14, true);
        this.exp = data.getUint32(16, true);
        this.ability = pkx[20];
        this.abilityNum = pkx[21];
        // 0x16, 0x17 - unknown
        this.pid = data.getUint32(24, true);
        this.nature = pkx[28];
        this.isFatefulEncounter = (pkx[29] & 1) == 1;
        this.gender = (((pkx[29] >> 1) & 3) & 0xFF);
        this.form = ((pkx[29] >> 3) & 0xFF);
        this.evHp = pkx[30];
        this.evAtk = pkx[31];
        this.evDef = pkx[32];
        this.evSpAtk = pkx[34];
        this.evSpDef = pkx[35];
        this.evSpe = pkx[33];
        this.contestStatCool = pkx[36];
        this.contestStatBeauty = pkx[37];
        this.contestStatCute = pkx[38];
        this.contestStatSmart = pkx[39];
        this.contestStatTough = pkx[40];
        this.contestStatSheen = pkx[41];
        this.markings = pkx[42];
        this.pkrsStrain = pkx[43] >> 4;
        this.pkrsDuration = pkx[43] % 16;
        this.ribbonSet1 = data.getUint16(48, true);
        this.ribbonSet2 = data.getUint16(50, true);
        this.ribbonSet3 = pkx[52];
        this.ribbonSet4 = pkx[53];

        // Block B
        this.nickname = util.decodeUnicode16LE(pkx, 64, 24);
        // 0x58, 0x59 - unused
        this.move1 = data.getUint16(90, true);
        this.move2 = data.getUint16(92, true);
        this.move3 = data.getUint16(94, true);
        this.move4 = data.getUint16(96, true);
        this.move1Pp = pkx[98];
        this.move2Pp = pkx[99];
        this.move3Pp = pkx[100];
        this.move4Pp = pkx[101];
        this.move1Ppu = pkx[102];
        this.move2Ppu = pkx[103];
        this.move3Ppu = pkx[104];
        this.move4Ppu = pkx[105];
        this.eggMove1 = data.getUint16(106, true);
        this.eggMove2 = data.getUint16(108, true);
        this.eggMove3 = data.getUint16(110, true);
        this.eggMove4 = data.getUint16(112, true);

        // 0x72 - Super Training Flag - Passed with pkx to new form

        // 0x73 - unused/unknown
        var IV32 = data.getUint32(116, true);
        this.ivHp = IV32 & 31;
        this.ivAtk = (IV32 >> 5) & 31;
        this.ivDef = (IV32 >> 10) & 31;
        this.ivSpe = (IV32 >> 15) & 31;
        this.ivSpAtk = (IV32 >> 20) & 31;
        this.ivSpDef = (IV32 >> 25) & 31;
        this.isEgg = ((IV32 >> 30) & 1) != 0;
        this.isNick = (IV32 >> 31) != 0;

        // Block C
        this.notOT = util.decodeUnicode16LE(pkx, 120, 24);
        var notOTG = (pkx[146]) != 0;
        // Memory Editor edits everything else with pkx in a new form

        // Block D
        this.ot = util.decodeUnicode16LE(pkx, 176, 24);
        // 0xC8, 0xC9 - unused
        this.otFriendship = pkx[202];
        this.otAffection = pkx[203]; // Handled by Memory Editor
        // 0xCC, 0xCD, 0xCE, 0xCF, 0xD0
        this.eggDate = new Date(pkx[209] + 2000, pkx[210], pkx[211], 0, 0, 0, 0).getTime();
        this.metDate = new Date(pkx[212] + 2000, pkx[213], pkx[214], 0, 0, 0, 0).getTime();
        // 0xD7 - unused
        this.eggLocation = data.getUint16(216, true);
        this.metLocation = data.getUint16(218, true);
        this.ball = pkx[220];
        this.levelMet = pkx[221] & 127;
        this.otGender = (pkx[221]) >> 7;
        this.encounterType = pkx[222];
        this.gameVersion = pkx[223];
        this.countryID = pkx[224];
        this.regionID = pkx[225];
        this.dsregID = pkx[226];
        this.otLang = pkx[227];

        this.hpType = ((15 * ((this.ivHp & 1) + 2 * (this.ivAtk & 1) + 4 * (this.ivDef & 1) + 8 * (this.ivSpe & 1) + 16 * (this.ivSpAtk & 1) + 32 * (this.ivSpDef & 1))) / 63 | 0) + 1;

        this.tsv = (((this.tid ^ this.sid) >> 4) & 0xFFFF);
        this.esv = (((((this.pid >> 16) & 65535) ^ (this.pid & 65535)) >> 4) & 0xFFFF);

        this.isShiny = (this.tsv == this.esv);
    }

    static deshuffle(pkx: Uint8Array, sv: number) {
        var ekx = new Uint8Array(pkx.length);
        util.copy(pkx, 0, ekx, 0, 8);

        // Deshuffle order
        var sloc = [[ 0, 1, 2, 3 ],
                    [ 0, 1, 3, 2 ],
                    [ 0, 2, 1, 3 ],
                    [ 0, 3, 1, 2 ],
                    [ 0, 2, 3, 1 ],
                    [ 0, 3, 2, 1 ],
                    [ 1, 0, 2, 3 ],
                    [ 1, 0, 3, 2 ],
                    [ 2, 0, 1, 3 ],
                    [ 3, 0, 1, 2 ],
                    [ 2, 0, 3, 1 ],
                    [ 3, 0, 2, 1 ],
                    [ 1, 2, 0, 3 ],
                    [ 1, 3, 0, 2 ],
                    [ 2, 1, 0, 3 ],
                    [ 3, 1, 0, 2 ],
                    [ 2, 3, 0, 1 ],
                    [ 3, 2, 0, 1 ],
                    [ 1, 2, 3, 0 ],
                    [ 1, 3, 2, 0 ],
                    [ 2, 1, 3, 0 ],
                    [ 3, 1, 2, 0 ],
                    [ 2, 3, 1, 0 ],
                    [ 3, 2, 1, 0 ]];

        var shuffle = sloc[sv];

        for (var b = 0; b < 4; b++)
            util.copy(pkx, 8 + 56 * shuffle[b], ekx, 8 + 56 * b, 56);

        // Copy back party data
        if (pkx.length > 232)
            util.copy(pkx, 232, ekx, 232, 28);
        return ekx;
    }

    static shuffle(pkx: Uint8Array, sv: number) {
        var ekx = new Uint8Array(pkx.length);
        util.copy(pkx, 0, ekx, 0, 8);

        // Shuffle order
        var sloc = [[ 0, 1, 2, 3 ],
                    [ 0, 1, 3, 2 ],
                    [ 0, 2, 1, 3 ],
                    [ 0, 2, 3, 1 ],
                    [ 0, 3, 1, 2 ],
                    [ 0, 3, 2, 1 ],
                    [ 1, 0, 2, 3 ],
                    [ 1, 0, 3, 2 ],
                    [ 1, 2, 0, 3 ],
                    [ 1, 2, 3, 0 ],
                    [ 1, 3, 0, 2 ],
                    [ 1, 3, 2, 0 ],
                    [ 2, 0, 1, 3 ],
                    [ 2, 0, 3, 1 ],
                    [ 2, 1, 0, 3 ],
                    [ 2, 1, 3, 0 ],
                    [ 2, 3, 0, 1 ],
                    [ 2, 3, 1, 0 ],
                    [ 3, 0, 1, 2 ],
                    [ 3, 0, 2, 1 ],
                    [ 3, 1, 0, 2 ],
                    [ 3, 1, 2, 0 ],
                    [ 3, 2, 0, 1 ],
                    [ 3, 2, 1, 0 ]];

        var shuffle = sloc[sv];

        for (var b = 0; b < 4; b++)
            util.copy(pkx, 8 + 56 * shuffle[b], ekx, 8 + 56 * b, 56);

        // Copy back party data
        if (pkx.length > 232)
            util.copy(pkx, 232, ekx, 232, 28);
        return ekx;
    }

    static decrypt(ekx: Uint8Array) {
        var pkx = new Uint8Array(232);
        util.copy(ekx, 0, pkx, 0, 232);
        var pv = util.createDataView(pkx).getUint32(0, true);
        var sv = (((pv & 0x3E000) >> 0xD) % 24);
        var seed = pv;

        var pkx16 = util.createUint16Array(pkx);
        for (var i = 4; i < 232/2; ++i) {
            seed = LCRNG.next(seed);
            pkx16[i] ^= ((seed >> 0x10) & 0xFFFF);
        }

        // Decrypt party data
        seed = pv;
        if (pkx.length > 232) {
            for (var i = 232 / 2; i < 260 / 2; ++i) {
                seed = LCRNG.next(seed);
                pkx16[i] ^= ((seed >> 16) & 0xFFFF);
            }
        }

        pkx = Pkx.deshuffle(pkx, sv);
        return pkx;
    }

    static encrypt(pkx: Uint8Array) {
        var ekx = new Uint8Array(pkx.length);
        util.copy(pkx, 0, ekx, 0, 232);
        var pv = util.createDataView(pkx).getUint32(0, true);
        var sv = (((pv & 0x3E000) >> 0xD) % 24);

        ekx = Pkx.shuffle(ekx, sv);

        var seed = pv;
        var ekx16 = new Uint16Array(ekx.buffer);
        // Encrypt blocks with RNG generated key
        for (var i = 4; i < 232/2; ++i) {
            seed = LCRNG.next(seed);
            ekx16[i] ^= ((seed >> 16) & 0xFFFF);
        }

        // Encrypt the party data
        seed = pv;
        if (pkx.length > 232) {
            for (var i = 232 / 2; i < 260 / 2; ++i) {
                seed = LCRNG.next(seed);
                ekx16[i] ^= ((seed >> 16) & 0xFFFF);
            }
        }

        return ekx;
    }

    static calcChk(pkx: Uint8Array) {
        var chk = 0;
        var pkx16 = util.createUint16Array(pkx);
        for (var i = 8/2; i < 232/2; i++) {
            chk += pkx16[i];
        }
        return chk&0xFFFF;
    }

    static verifyChk(pkx: Uint8Array) {
        var chk = 0;
        var pkx16 = util.createUint16Array(pkx);
        for (var i = 8/2; i < 232/2; i++) {
            chk += pkx16[i];
        }

        var actualsum = pkx16[6/2];
        if (pkx16[8/2] > 750 || pkx16[144/2] != 0)
            return false;
        return (chk & 0xFFFF) == actualsum;
    }

    static getDloc(ec: number) {
        return [ 3, 2, 3, 2, 1, 1, 3, 2, 3, 2, 1, 1, 3, 2, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0 ][
            ((ec & 0x3E000) >> 0xD) % 24
        ];
    }
}
