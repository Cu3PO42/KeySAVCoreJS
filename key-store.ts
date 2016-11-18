import SaveKey from "./save-key";
import BattleVideoKey from "./battle-video-key";
import { createDataView, getStampSav, getStampBv } from "./util";

export interface KeyStore {
    getSaveKey(stamp: string): Promise<SaveKey>;
    getBvKey(stamp: string): Promise<BattleVideoKey>;
    setSaveKey(key: SaveKey): Promise<void>;
    setOrMergeSaveKey(key: SaveKey): Promise<void>;
    setBvKey(key: BattleVideoKey): Promise<void>;
    setOrMergeBvKey(key: BattleVideoKey): Promise<void>;
}

var currentKeyStore: KeyStore = undefined;

export function setKeyStore(store: KeyStore): void {
    currentKeyStore = store;
}

export function getKeyStore(): KeyStore {
    return currentKeyStore;
}

export default KeyStore;

export function getStampAndKindFromKey(arr: Uint8Array, size: number): { stamp: string, kind: number } {
    const dataView = createDataView(arr);
    if (dataView.getUint32(0x10, true) === 0xCAFEBABE) {
        switch (dataView.getUint16(0x14, true)) {
            case 0:
                return { stamp: getStampSav(arr, 0), kind: 0 };
            case 1:
                return { stamp: getStampBv(arr, 0), kind: 1 };
            default:
                return { stamp: "", kind: -1 };
        }
    }

    if (size === 0x80000 || size === 0xB4AD4) {
        return { stamp: getStampSav(arr, 0), kind: 0 };
    }

    if (size === 0x1000) {
        return { stamp: getStampBv(arr, 0), kind: 1 };
    }

    return { stamp: "", kind: -1 };
}
