"use strict";

import SaveKey from "./save-key";

interface KeyStore {
    getSaveKey(stamp: string): Promise<SaveKey>;
    getBvKey(stamp: string): Promise<Uint8Array>;
}

export var currentKeyStore: KeyStore = undefined;

export function setKeyStore(store: KeyStore): void {
    currentKeyStore = store;
}

export default KeyStore;
