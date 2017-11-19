import * as util from "./util";
import * as LCRNG from "./lcrng";

const knownPkmImplementations: { [version: number]: { new(pkx: Uint8Array, box: number, slot: number, ghost: boolean): PkBase } } = {};

/**
 * Register an implementation of a generation specific specialization of [[PkBase]].
 * 
 * @param generation The generation this specialization is for
 * @param impl The implementation of the specialization
 */
export function registerPkmImpl(generation: number, impl: { new(pkx: Uint8Array, box: number, slot: number, ghost: boolean): PkBase }) {
    knownPkmImplementations[generation] = impl;
}

/**
 * The base class for all rerpresentations of a Pokémon.
 * 
 * It includes the common properties shared by Pokémon as well as some static helper methods for de- and encryption.
 */
export default class PkBase {
    public version: number;

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
    public hpType: number;
    public markings: number;


    // Ints
    public pkrsStrain: number;
    public pkrsDuration: number;
    public levelMet: number;

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
    public notOtFriendship: number;
    public notOtAffection: number;
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
    public contestMemoryRibbonCount: number;
    public battleMemoryRibbonCount: number;
    public form: number;
    public gender: number;

    public metDate: [number, number, number];
    public eggDate: [number, number, number];

    public isEgg: boolean;
    public isNick: boolean;
    public isShiny: boolean;
    public isGhost: boolean;
    public isFatefulEncounter: boolean;
    public otGender: boolean;
    public notOtGender: boolean;
    public currentHandler: boolean;

    public geoRegion1: number;
    public geoCountry1: number;
    public geoRegion2: number;
    public geoCountry2: number;
    public geoRegion3: number;
    public geoCountry3: number;
    public geoRegion4: number;
    public geoCountry4: number;
    public geoRegion5: number;
    public geoCountry5: number;

    public fullness: number;
    public enjoyment: number;

    public data: number[];
    public ribbonData: number[];

    public nickname: string;
    public notOT: string;
    public ot: string;

    /**
     * Construct a new Pokémon representation.
     * 
     * @param pkx The raw Pkx data.
     * @param box The box the Pokémon is located in.
     * @param slot The slot in the box the Pokémon is located in.
     * @param isGhost True if the Pokémon might be an artifact of bad decryption
     */
    constructor(pkx: Uint8Array, box: number, slot: number, isGhost: boolean) {
        this.data = Array.from(pkx);
        this.box = box;
        this.slot = slot;
        this.isGhost = isGhost;

        var data: DataView = util.createDataView(pkx);

        this.ec = data.getUint32(0x0, true);
        this.chk = data.getUint16(0x6, true);
        this.species = data.getUint16(0x8, true);
        this.heldItem = data.getUint16(0xa, true);
        this.tid = data.getUint16(0xc, true);
        this.sid = data.getUint16(0xe, true);
        this.exp = data.getUint32(0x10, true);
        this.ability = pkx[0x14];
        this.abilityNum = pkx[0x15];
        this.pid = data.getUint32(0x18, true);
        this.nature = pkx[0x1c];
        this.isFatefulEncounter = (pkx[0x1d] & 1) == 1;
        this.gender = (pkx[0x1d] >> 1) & 3;
        this.form = pkx[0x1d] >> 3;
        this.evHp = pkx[0x1e];
        this.evAtk = pkx[0x1f];
        this.evDef = pkx[0x20];
        this.evSpAtk = pkx[0x22];
        this.evSpDef = pkx[0x23];
        this.evSpe = pkx[0x21];
        this.contestStatCool = pkx[0x24];
        this.contestStatBeauty = pkx[0x25];
        this.contestStatCute = pkx[0x26];
        this.contestStatSmart = pkx[0x27];
        this.contestStatTough = pkx[0x28];
        this.contestStatSheen = pkx[0x29];
        this.pkrsStrain = pkx[0x2b] >> 4;
        this.pkrsDuration = pkx[0x2b] & 0xF;
        this.ribbonSet1 = data.getUint16(0x30, true);
        this.ribbonSet2 = data.getUint16(0x32, true);
        this.ribbonSet3 = pkx[0x34];
        this.ribbonSet4 = pkx[0x35];
        this.ribbonData = Array.from(pkx.subarray(0x30, 0x38));
        this.contestMemoryRibbonCount = pkx[0x38];
        this.battleMemoryRibbonCount = pkx[0x39];

        // Block B
        this.nickname = util.decodeUnicode16LE(pkx, 0x40, 24);
        // 0x58, 0x59 - unused
        this.move1 = data.getUint16(0x5a, true);
        this.move2 = data.getUint16(0x5c, true);
        this.move3 = data.getUint16(0x5e, true);
        this.move4 = data.getUint16(0x60, true);
        this.move1Pp = pkx[0x62];
        this.move2Pp = pkx[0x63];
        this.move3Pp = pkx[0x64];
        this.move4Pp = pkx[0x65];
        this.move1Ppu = pkx[0x66];
        this.move2Ppu = pkx[0x67];
        this.move3Ppu = pkx[0x68];
        this.move4Ppu = pkx[0x69];
        this.eggMove1 = data.getUint16(0x6a, true);
        this.eggMove2 = data.getUint16(0x6c, true);
        this.eggMove3 = data.getUint16(0x6e, true);
        this.eggMove4 = data.getUint16(0x70, true);

        var IV32 = data.getUint32(0x74, true);
        this.ivHp = IV32 & 31;
        this.ivAtk = (IV32 >> 5) & 31;
        this.ivDef = (IV32 >> 10) & 31;
        this.ivSpe = (IV32 >> 15) & 31;
        this.ivSpAtk = (IV32 >> 20) & 31;
        this.ivSpDef = (IV32 >> 25) & 31;
        this.isEgg = ((IV32 >> 30) & 1) != 0;
        this.isNick = (IV32 >> 31) != 0;

        // Block C
        this.notOT = util.decodeUnicode16LE(pkx, 0x78, 24);
        this.notOtGender = pkx[0x92] != 0;
        this.currentHandler = pkx[0x93] != 0;
        this.notOtFriendship = pkx[0xa2];
        this.notOtAffection = pkx[0xa3];
        this.geoRegion1 = pkx[0x94];
        this.geoCountry1 = pkx[0x95];
        this.geoRegion2 = pkx[0x96];
        this.geoCountry2 = pkx[0x97];
        this.geoRegion3 = pkx[0x98];
        this.geoCountry3 = pkx[0x99];
        this.geoRegion4 = pkx[0x9a];
        this.geoCountry4 = pkx[0x9b];
        this.geoRegion5 = pkx[0x9c];
        this.geoCountry5 = pkx[0x9d];
        this.fullness = pkx[0xae];
        this.enjoyment = pkx[0xaf];

        // Block D
        this.ot = util.decodeUnicode16LE(pkx, 0xb0, 24);
        // 0xC8, 0xC9 - unused
        this.otFriendship = pkx[0xca];
        this.otAffection = pkx[0xcb]; // Handled by Memory Editor
        // 0xCC, 0xCD, 0xCE, 0xCF, 0xD0
        this.eggDate = (pkx[0xd1] | pkx[0xd2] | pkx[0xd3]) != 0 ? [pkx[0xd1] + 2000, pkx[0xd2]-1, pkx[0xd3]] : [2000, 0, 1];
        this.metDate = (pkx[0xd4] | pkx[0xd5] | pkx[0xd6]) != 0 ? [pkx[0xd4] + 2000, pkx[0xd5]-1, pkx[0xd6]] : [2000, 0, 1];
        // 0xD7 - unused
        this.eggLocation = data.getUint16(0xd8, true);
        this.metLocation = data.getUint16(0xda, true);
        this.ball = pkx[0xdc];
        this.levelMet = pkx[0xdd] & 127;
        this.otGender = (pkx[0xdd] >> 7) != 0;
        this.encounterType = pkx[0xde];
        this.gameVersion = pkx[0xdf];
        this.countryID = pkx[0xe0];
        this.regionID = pkx[0xe1];
        this.dsregID = pkx[0xe2];
        this.otLang = pkx[0xe3];

        this.hpType = ((15 * ((this.ivHp & 1) + 2 * (this.ivAtk & 1) + 4 * (this.ivDef & 1) + 8 * (this.ivSpe & 1) + 16 * (this.ivSpAtk & 1) + 32 * (this.ivSpDef & 1))) / 63 | 0) + 1;

        this.tsv = (((this.tid ^ this.sid) >> 4) & 0xFFFF);
        this.esv = (((((this.pid >> 16) & 65535) ^ (this.pid & 65535)) >> 4) & 0xFFFF);

        this.isShiny = (this.tsv == this.esv);
    }

    /**
     * Create a new Pokémon representation with the given data for the given generation.
     * 
     * A specialization for this generation must have been registered previously.
     * 
     * @param pkx The raw Pkx data.
     * @param generation The generation the Pokémon is from.
     * @param box The box the Pokémon is located in.
     * @param slot The slot in the box the Pokémon is located in.
     * @param isGhost True if the Pokémon might be an artifact of bad decryption
     */
    static makePkm(pkx: Uint8Array, generation: number, box: number, slot: number, ghost: boolean) {
        return new knownPkmImplementations[generation](pkx, box, slot, ghost);
    }

    /**
     * Unshuffle the blocks in the given Pokémon data with the given shuffling value and return the new data.
     * 
     * The Pokémon data consists of four blocks. They are shuffled prior to encryption with an xorpad.
     * 
     * @param pkx The raw Pokémon data
     * @param sv The shuffling value
     * @return The unshuffled Pokémon data
     */
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

    /**
     * Shuffle the blocks in the given Pokémon data with the given shuffling value and return the new data.
     * 
     * The Pokémon data consists of four blocks. They are shuffled prior to encryption with an xorpad.
     * 
     * @param pkx The raw Pokémon data
     * @param sv The shuffling value
     * @return The shuffled Pokémon data
     */
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

    /**
     * Decrypt the given ekx data and return the pkx.
     * 
     * @param ekx The data to decrypt
     * @return The decrypted pkx
     */
    static decrypt(ekx: Uint8Array) {
        var pkx = new Uint8Array(ekx.length);
        util.copy(ekx, 0, pkx, 0, ekx.length);
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

        pkx = PkBase.deshuffle(pkx, sv);
        return pkx;
    }

    /**
     * Encrypt the given pkx and return the ekx.
     * 
     * @param pkx The pkx to encrypt
     * @return The encrypted ekx
     */
    static encrypt(pkx: Uint8Array) {
        var ekx = new Uint8Array(pkx.length);
        util.copy(pkx, 0, ekx, 0, ekx.length);
        var pv = util.createDataView(pkx).getUint32(0, true);
        var sv = (((pv & 0x3E000) >> 0xD) % 24);

        ekx = PkBase.shuffle(ekx, sv);

        var seed = pv;
        var ekx16 = util.createUint16Array(ekx);
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

    /**
     * Calculate the checksum of some pkx data and write the checksum to the data.
     * 
     * @param pkx The data whose checksum to fix
     */
    static fixChk(pkx: Uint8Array) {
        var chk = 0;
        var pkx16 = util.createUint16Array(pkx);
        for (var i = 8/2; i < 232/2; i++) {
            chk += pkx16[i];
        }
        pkx16[6/2] = chk & 0xFFFF;
    }

    /**
     * Calculate and verify the checksum of some pkx data.
     * 
     * @param pkx The data to verify
     */
    static verifyChk(pkx: Uint8Array) {
        var chk = 0;
        var pkx16 = util.createUint16Array(pkx);
        for (var i = 8/2; i < 232/2; i++) {
            chk += pkx16[i];
        }

        var actualsum = pkx16[6/2];
        if (pkx16[8/2] > 805 || pkx16[0x90 / 2] != 0)
            return false;
        return (chk & 0xFFFF) == actualsum;
    }

    /**
     * Given an encryption constant calculate where the fourth block of Pokémon data will be located after shuffling.
     * 
     * @param ec The encryption constant
     * @return The location of the fourth block
     */
    static getDloc(ec: number) {
        return [ 3, 2, 3, 2, 1, 1, 3, 2, 3, 2, 1, 1, 3, 2, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0 ][
        ((ec & 0x3E000) >> 0xD) % 24
            ];
    }
}

import "./pk6";
import "./pk7";
