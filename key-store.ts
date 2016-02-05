"use strict";

import SaveKey from "./save-key";
import BattleVideoKey from "./battle-video-key";
import Pkx from "./pkx";

export interface KeyStore {
    getSaveKey(stamp: string): Promise<SaveKey>;
    getBvKey(stamp: string): Promise<BattleVideoKey>;
    setSaveKey(key: SaveKey, pkm: Pkx);
    setBvKey(key: BattleVideoKey);
}

export var currentKeyStore: KeyStore = undefined;

export function setKeyStore(store: KeyStore): void {
    currentKeyStore = store;
}

export default KeyStore;
