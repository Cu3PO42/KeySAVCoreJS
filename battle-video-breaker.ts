import BattleVideoReader from "./battle-video-reader";
import { getKeyStore } from "./key-store";
import * as util from "./util";
import PkBase from "./pkbase";
import BattleVideoKey from "./battle-video-key";

/**
 * Open a battle video in a reader. Get the key for this video from the global key store.
 * 
 * @param input The battle video to load
 * @return A promise for the [[BattleVideoReader]] for the given video
 */
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

function breakParty(reader1: BattleVideoReader, reader2: BattleVideoReader, partyOffset: number, key: BattleVideoKey, partyNumber: number): boolean {
    // The teams from the two videos XORed together
    var partyXored = util.xor(reader1.video, partyOffset, reader2.video, partyOffset, 260*6);

    // Retrieve data for the Pokémon that is in slot 1 in video 1 and slot 2 in video 2
    var ekx = util.xor(encryptedZeros, 0, partyXored, 260, 260);
    var pkx = PkBase.decrypt(ekx);
    var isValid = PkBase.verifyChk(pkx);
    if (!isValid || (pkx[0x8] | pkx[0x9]) === 0) {
        return false;
    }

    // Keystream for slot one (ekx is the Pokémon in the first slot)
    util.xor(ekx, 0, reader1.video, partyOffset, key.teamKeys[partyNumber], 0, 260);
    // All remaining 5 slots are empty (they contain the enctypted zeroes) in video1 and the keystream can be extracted directly
    for (var i = 1; i < 6; ++i)
        util.xor(reader1.video, partyOffset + 260 * i, encryptedZeros, 0, key.teamKeys[partyNumber], 260 * i, 260);

    if (reader1.getPkx(0, partyNumber) === undefined || reader1.getPkx(1, partyNumber) !== undefined
        || reader2.getPkx(1, partyNumber) === undefined || reader2.getPkx(2, partyNumber) !== undefined) {
        util.clear(key.teamKeys[partyNumber]);
        return false;
    }

    return true;
}

/**
 * Create or upgrade a key for a battle video slot using the supplied videos.
 * 
 * A key contains sub keys for the different teams that may be part of a battle. To unlock any such sub key the
 * following must hold for the two provided videos:
 * 
 * * In video 1 the team contained only one Pokémon
 * * In video 2 the team contained two Pokémon where the second one must be the same as the Pokémon in the first video
 * 
 * The operation will fail if the two provided are not from the same game and slot.
 * 
 * @param video1 The first battle video
 * @param video2 The second battle video
 * @return A Promise for an object containing a flag upgraded that is true if an existing key was upgraded rather than
 *         a new one created and an array of flags indicating which sub keys are working
 */
export async function breakKey(video1: Uint8Array, video2: Uint8Array): Promise<{upgraded: boolean, workingKeys: boolean[]}> {
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
        if (key.workingKeys.every(e => e)) {
            var e = new Error("You already have a key for this battle video slot.") as any;
            e.name = "BattleVideoKeyAlreadyExistsError";
            throw e;
        }
    } catch (e) {
        if (e.name === "BattleVideoKeyAlreadyExistsError") {
            throw e;
        }
    }

    const newKey = new BattleVideoKey(generation1);
    util.copy(video1, 0x10, newKey.keyData, 0, 0x10);
    const reader1 = new BattleVideoReader(video1, newKey);
    const reader2 = new BattleVideoReader(video2, newKey);

    if (!offsets.partyOffsets.map((o, i) => breakParty(reader1, reader2, o, newKey, i)).some(e => e)) {
        var e = new Error("Improperly set up Battle Videos. Please follow directions and try again.") as any;
        e.name = "BattleVideoBreakError";
        throw e;
    }

    if (key === undefined) {
        await getKeyStore().setBvKey(newKey);
        return { upgraded: undefined, workingKeys: newKey.workingKeys };
    }

    const unlockedBefore = key.workingKeys;
    key.mergeKey(newKey);
    const unlockedAfter = key.workingKeys;
    return { upgraded: unlockedBefore.some((e, i) => !e && unlockedAfter[i]), workingKeys: unlockedAfter };
}
