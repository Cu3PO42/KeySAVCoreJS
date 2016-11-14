"use strict";

import SaveKey from "./save-key";
import BattleVideoKey from "./battle-video-key";

export interface KeyStore {
    getSaveKey(stamp: string): Promise<SaveKey>;
    getBvKey(stamp: string): Promise<BattleVideoKey>;
    setSaveKey(key: SaveKey): Promise<void>;
    setOrMergeSaveKey(key: SaveKey): Promise<void>;
    setBvKey(key: BattleVideoKey): Promise<void>;
    setOrMergeBvKey(key: BattleVideoKey): Promise<void>;
}

export var currentKeyStore: KeyStore = undefined;

export function setKeyStore(store: KeyStore): void {
    currentKeyStore = store;
}

export function getKeyStore(): KeyStore {
    return currentKeyStore;
}

export default KeyStore;
