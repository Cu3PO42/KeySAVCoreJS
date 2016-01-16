declare class KeyStore {
    constructor(path: string);
    getSaveKey(stamp1: number, stamp2: number, callback: (e: Error, key: KeySAVCore.Structures.SaveKey) => void);
    getBvKey(stamp1: number, stamp2: number, callback: (e: Error, key: Uint8Array) => void);
    setKey(name: string, data: Uint8Array, key?: KeySAVCore.Structures.SaveKey);
    close();
}

export = KeyStore;
