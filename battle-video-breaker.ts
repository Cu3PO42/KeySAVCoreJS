"use strict";

import BattleVideoReader from "./battle-video-reader";
import { getKeyStore } from "./key-store";
import * as util from "./util";
import PkBase from "./pkbase";
import BattleVideoKey from "./battle-video-key";

export async function load(input: Uint8Array): Promise<BattleVideoReader> {
    if (BattleVideoReader.getGeneration(input) === -1) {
        var e = new Error("The supplied data is not a valid battle video.") as any;
        e.name = "NotABattleVideoError";
        throw e;
    }
    var key = await getKeyStore().getBvKey(util.getStampBv(input, 0x10));
    return new BattleVideoReader(input, key);
}

var encryptedZeros = PkBase.encrypt(new Uint8Array(260));



function breakParty(video1: Uint8Array, video2: Uint8Array, partyOffset: number, key: Uint8Array): boolean {
    // The teams from the two videos XORed together
    var partyXored = util.xor(video1, partyOffset, video2, partyOffset, 260*6);

    // Retrieve data for the Pokémon that is in slot 1 in video 1 and slot 2 in video 2
    var ekx = util.xor(encryptedZeros, 0, partyXored, 260, 260);
    var pkx = PkBase.decrypt(ekx);
    var isValid = PkBase.verifyChk(pkx);
    if (!isValid || (pkx[0x8] | pkx[0x9]) === 0) {
        return false;
    }

    // Keystream for slot one (ekx is the Pokémon in the first slot)
    util.xor(ekx, 0, video1, partyOffset, key, 0, 260);
    // All remaining 5 slots are empty (they contain the enctypted zeroes) in video1 and the keystream can be extracted directly
    for (var i = 1; i < 6; ++i)
        util.xor(video1, partyOffset + 260 * i, encryptedZeros, 0, key, 260 * i, 260);

    return true;
}

function checkParty(video1: Uint8Array, video2: Uint8Array, key: BattleVideoKey): boolean {
    const video1Reader = new BattleVideoReader(video1, key);
    const video2Reader = new BattleVideoReader(video2, key);
    const video1Pkx = video1Reader.getAllPkx();
    const video2Pkx = video2Reader.getAllPkx();
    return !(video1Pkx.myTeam.length !== 1 || video2Pkx.myTeam.length !==2 ||
        key.dumpsOpponent && (video1Pkx.opponentTeam.length !== 1 || video2Pkx.opponentTeam.length !== 2));
}

export async function breakKey(video1: Uint8Array, video2: Uint8Array): Promise<string> {
    const generation1 = BattleVideoReader.getGeneration(video1);
    if (generation1 === -1) {
        var e = new Error("The first file is not a battle video.") as any;
        e.name = "NotABattleVideoError";
        e.file = 1;
        throw e;
    }

    const generation2 = BattleVideoReader.getGeneration(video2);
    if (generation2 === -1) {
        var e = new Error("The second file is not a valid battle video.") as any;
        e.name = "NotABattleVideoError";
        e.file = 2;
        throw e;
    }

    if (generation1 !== generation2) {
        var e = new Error("The battle videos are not from the same generation.") as any;
        e.name = "BattleVideosNotSameGenerationError";
        throw e;
    }

    const offsets = BattleVideoReader.getOffsets(generation1);

    if (!util.sequenceEqual(video1, 0x10, video2, 0x10, 0x10)) {
        var e = new Error("Battle videos are not from the same game or battle video slot.") as any;
        e.name = "NotSameBattleVideoSlotError";
        throw e;
    }

    var key: BattleVideoKey;
    try {
        key = await getKeyStore().getBvKey(util.getStampBv(video1, 0x10));
        if (key.dumpsOpponent) {
            var e = new Error("You already have a key for this battle video slot.") as any;
            e.name = "BattleVideoKeyAlreadyExistsError";
            throw e;
        }
    } catch (e) {
        if (e.name === "BattleVideoKeyAlreadyExistsError") {
            throw e;
        }
    }

    if (key === undefined) {
        key = new BattleVideoKey(new Uint8Array(0x1000));

        if (!breakParty(video1, video2, offsets.myParty, key.myTeamKey)) {
            var e = new Error("Improperly set up Battle Videos. Please follow directions and try again.") as any;
            e.name = "BattleVideoBreakError";
            throw e;
        }

        // Try to create a key for the opponent, too
        const res = breakParty(video1, video2, offsets.opponentParty, key.opponentTeamKey) ? "CREATED_WITH_OPPONENT" : "CREATED_WITHOUT_OPPONENT";
        if (!checkParty(video1, video2, key)) {
            var e = new Error("Improperly set up Battle Videos. Please follow directions and try again.") as any;
            e.name = "BattleVideoBreakError";
            throw e;
        }

        // Set the unique stamp for this battle video slot
        util.copy(video1, 0x10, key.stampRaw, 0, 0x10);
        await getKeyStore().setBvKey(key);

        return res;
    }

    // We already have a key for out team, but we might be able to upgrade it so it can work with the opponent team, too.
    return breakParty(video1, video2, offsets.opponentParty, key.opponentTeamKey) && checkParty(video1, video2, key) ? "UPGRADED_WITH_OPPONENT" : "NOT_UPGRADED_WITH_OPPONENT";
}
