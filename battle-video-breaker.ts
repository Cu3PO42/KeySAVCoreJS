"use strict";

import BattleVideoReader from "./battle-video-reader";
import { currentKeyStore } from "./key-store";
import * as util from "./util";
import Pkx from "./pkx";
import BattleVideoKey from "./battle-video-key";

export async function load(input: Uint8Array): Promise<BattleVideoReader> {
    var key = await currentKeyStore.getBvKey(util.getStampBv(input, 0x10));
    return new BattleVideoReader(input, key);
}

export interface BattleVideoBreakResult {
    success: boolean;
    result: string;
}

var encryptedZeros = Pkx.encrypt(new Uint8Array(260));

function breakParty(video1: Uint8Array, video2: Uint8Array, partyOffset: number, key: Uint8Array): Uint8Array {
    // The teams from the two videos XORed together
    var partyXored = util.xor(video1, partyOffset, video2, 0x4E18, 260*6);

    // Retrieve data for the Pokémon that is in slot 1 in video 1 and slot 2 in video 2
    var ekx = util.xor(encryptedZeros, 0, partyXored, 260, 260);
    var pkx = Pkx.decrypt(ekx);
    if (!Pkx.verifyChk(pkx) || (pkx[0x8] | pkx[0x9]) === 0) {
        return undefined;
    }

    // Keystream for slot one (ekx is the Pokémon in the first slot)
    util.xor(ekx, 0, video1, partyOffset, key, 0, 260);
    // All remaining 5 slots are empty (they contain the enctypted zeroes) in video1 and the keystream can be extracted directly
    for (var i = 1; i < 6; ++i)
        util.xor(video1, partyOffset + 260 * i, key, 260 * i, 260);

    return pkx;
}

export function breakKey(video1: Uint8Array, video2: Uint8Array): BattleVideoBreakResult {
    var key = new BattleVideoKey(new Uint8Array(0x1000));

    if (!util.sequenceEqual(video1, 0x10, video2, 0x10, 0x10)) {
        return { success: false, result: "Battle videos are not from the same game or battle video slot." };
    }

    var pkx = breakParty(video1, video2, 0x4E18, key.myTeamKey);
    if (pkx === undefined) {
        return { success: false, result: "Improperly set up Battle Videos. Please follow directions and try again." };
    }

    // Set the unique stamp for this battle video slot
    util.copy(video1, 0x10, key.stampRaw, 0, 0x10);

    // Try to create a key for the opponent, too
    var canDumpOpponent = breakParty(video1, video2, 0x5438, key.opponentTeamKey) !== undefined;

    var decodedPkx = new Pkx(pkx, -1, 0, false);
    var result = `Success!\nYour first Pokemon's TSV: ${util.pad4(decodedPkx.tsv)}\nOT: ${decodedPkx.ot}\n`
    if (canDumpOpponent) {
        result += "Can dump from Opponent Data on this key too!\n";
    }
    result += "\nYour keystream will be saved.";
    currentKeyStore.setBvKey(key);
    return { success: true, result: result };
}
