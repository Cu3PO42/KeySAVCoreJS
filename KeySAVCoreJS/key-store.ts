import SaveKey from "./save-key";

interface KeyStore {
    getSaveKey(stamp: [number, number]): Promise<SaveKey>;
    getBvKey(stamp: [number, number]): Promise<Uint8Array>;
}

export default KeyStore;