"use strict";

import BattleVideoReader from "./battle-video-reader";
import { getKeyStore } from "./key-store";
import * as util from "./util";
import Pkx from "./pkx";
import BattleVideoKey from "./battle-video-key";

export async function load(input: Uint8Array): Promise<BattleVideoReader> {
    if (input.length !== 0x6E60) {
        var e = new Error("The supplied data is not a valid battle video.") as any;
        e.name = "NotABattleVideoError";
        throw e;
    }
    var key = await getKeyStore().getBvKey(util.getStampBv(input, 0x10));
    return new BattleVideoReader(input, key);
}

var encryptedZeros = Pkx.encrypt(new Uint8Array(260));

function breakParty(video1: Uint8Array, video2: Uint8Array, partyOffset: number, key: Uint8Array): boolean {
    // The teams from the two videos XORed together
    var partyXored = util.xor(video1, partyOffset, video2, partyOffset, 260*6);

    // Retrieve data for the Pokémon that is in slot 1 in video 1 and slot 2 in video 2
    var ekx = util.xor(encryptedZeros, 0, partyXored, 260, 260);
    var pkx = Pkx.decrypt(ekx);
    if (!Pkx.verifyChk(pkx) || (pkx[0x8] | pkx[0x9]) === 0) {
        return false;
    }

    // Keystream for slot one (ekx is the Pokémon in the first slot)
    util.xor(ekx, 0, video1, partyOffset, key, 0, 260);
    // All remaining 5 slots are empty (they contain the enctypted zeroes) in video1 and the keystream can be extracted directly
    for (var i = 1; i < 6; ++i)
        util.xor(video1, partyOffset + 260 * i, encryptedZeros, 0, key, 260 * i, 260);

    return true;
}

export async function breakKey(video1: Uint8Array, video2: Uint8Array): Promise<string> {
    if (video1.length !== 0x6E60) {
        var e = new Error("The first file is not a battle video.") as any;
        e.name = "NotABattleVideoError";
        e.file = 1;
        throw e;
    }

    if (video2.length !== 0x6E60) {
        var e = new Error("The second file is not a valid battle video.") as any;
        e.name = "NotABattleVideoError";
        e.file = 2;
        throw e;
    }

    if (!util.sequenceEqual(video1, 0x10, video2, 0x10, 0x10)) {
        var e = new Error("Battle videos are not from the same game or battle video slot.") as any;
        e.name = "NotSameBattleVideoSlotError";
        throw e;
    }

    var key: BattleVideoKey;
    try {
        key = await getKeyStore().getBvKey(util.getStampBv(video1, 0x10));
        var e = new Error("You already have a key for this battle video slot.") as any;
        e.name = "BattleVideoKeyAlreadyExistsError";
        throw e;
    } catch (e) {
        if (e.name === "BattleVideoKeyAlreadyExistsError") {
            throw e;
        }
    }

    var key = new BattleVideoKey(new Uint8Array(0x1000));

    if (!breakParty(video1, video2, 0x4E18, key.myTeamKey)) {
        var e = new Error("Improperly set up Battle Videos. Please follow directions and try again.") as any;
        e.name = "BattleVideoBreakError";
        throw e;
    }

    // Set the unique stamp for this battle video slot
    util.copy(video1, 0x10, key.stampRaw, 0, 0x10);
    getKeyStore().setBvKey(key);

    // Try to create a key for the opponent, too
    return breakParty(video1, video2, 0x5438, key.opponentTeamKey) ? "CREATED_WITH_OPPONENT" : "CREATED_WITHOUT_OPPONENT";
}
