import { breakKey as breakKeyBv, load as loadBv } from "./battle-video-breaker";
import { breakKey as breakKeySav, load as loadSav } from "./save-breaker";
import BattleVideoReader from "./battle-video-reader";
import SaveReader from "./save-reader";

/**
 * Load a given file. The file may be either a battle video or a save file.
 * 
 * The appropriate key will be retrieved from the global keystore if possible, otherwise an error will be thrown.
 * 
 * @param file The file to load.
 */
export async function loadSavOrBv(file: Uint8Array): Promise<{type: string, reader: SaveReader|BattleVideoReader}> {
    try {
        return {
            type: "BV",
            reader: await loadBv(file)
        };
    } catch(e) {
        if (e.name === "NoKeyAvailableError") {
            throw e;
        }
    }
    try {
        return {
            type: "SAV",
            reader: await loadSav(file)
        };
    } catch(e) {
        if (e.name === "NoKeyAvailableError") {
            throw e;
        }
    }
    var e = new Error("The supplied file is neither a valid save nor a valid battle video.") as any;
    e.name = "NotASaveOrBattleVideoError";
    throw e;
}

const typeDescription = {
    "SAV": "a save file",
    "BV": "a battle video",
    "NONE": "neither a save file nor a battle video"
};

function makeNotSameFileError(type1: string, type2: string) {
    var e = new Error(`The two files don't have the same type. The first is ${typeDescription[type1]}, the second is ${typeDescription[type2]}.`) as any;
    e.name = "NotSameFileTypeError";
    e.fileType1 = type1;
    e.fileType2 = type2;
    return e;
}

function checkSavLength(length: number) {
    return length === 0x100000 || length === 0x10009C || length === 0x10019A ||
        length === 0x0fe000 || length === 0x0fe09c || length === 0x0fe19a;
}

/**
 * Create or upgrade a key with the given files.
 * 
 * Both files must be of the same type (battle video or save) and satisfy the requirements outlined in the relevant
 * breakKey function.
 * 
 * @param file1 The first file to use
 * @param file2 The second file to use
 */
export async function breakSavOrBv(file1: Uint8Array, file2: Uint8Array): Promise<{ type: string, result: any }> {
    if (file1.length === 0x6E60 || file1.length === 0x6bc0) {
        if (file2.length === 0x6E60 || file1.length === 0x6bc0) {
            return { type: "BV", result: await breakKeyBv(file1, file2) };
        }
        let type2 = checkSavLength(file2.length) ? "SAV" : "NONE";
        throw makeNotSameFileError("BV", type2);
    }

    if (checkSavLength(file1.length)) {
        if (checkSavLength(file2.length)) {
            return { type: "SAV", result: await breakKeySav(file1, file2) };
        }
        throw makeNotSameFileError("SAV", file2.length === 0x6E60 ? "BV" : "NONE");
    }

    throw makeNotSameFileError("NONE", file2.length === 0x6E60 ? "BV" : checkSavLength(file2.length) ? "SAV" : "NONE");
}
