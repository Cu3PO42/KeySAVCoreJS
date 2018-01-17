import { KeyStore, createNoKeyError, createNotStoredKeyError } from "./key-store";
import SaveKey from "./save-key";
import BattleVideoKey from "./battle-video-key";

export default class KeyStoreIndexedDB implements KeyStore {
  private db: IDBDatabase;
  private dbErr: Event;
  private waiter: Promise<void>;

  private openSavKeys: { [stamp: string]: SaveKey } = {};
  private openBvKeys: { [stamp: string]: BattleVideoKey } = {};
  
  constructor() {
      const openRequest = indexedDB.open("keysave-keys", 1);
      this.waiter = new Promise((resolve, reject) => {
        openRequest.onerror = openRequest.onblocked = (err) => {
          console.log('Could not open key DB');
          this.dbErr = err;
          this.waiter = undefined;
          resolve();
        };
        openRequest.onsuccess = (e) => {
          this.db = (e.target as any).result;
          this.waiter = undefined;
          resolve();
        };
        openRequest.onupgradeneeded = (e) => {
          const db = (e.target as any).result as IDBDatabase;
          db.createObjectStore("save-keys", {});
          db.createObjectStore("bv-keys", {});
        };
      });
  }

  private async waitForOpen() {
    if (this.waiter) await this.waiter;
    if (this.dbErr) throw this.dbErr;
  }

  private async getKey(stamp: string, kind: number) {
    await this.waitForOpen();

    const storeName = kind === 0 ? 'save-keys' : 'bv-keys';
    const openKeys = kind === 0 ? this.openSavKeys : this.openBvKeys;    
    const keyStore: KeyStore = this;

    if (openKeys[stamp])
      return openKeys[stamp];

    const transaction = this.db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(stamp);
    return new Promise((resolve, reject) => {
      request.onsuccess = (e) => {
        const keyData = request.result as Uint8Array;
        if (keyData === undefined)
          reject(createNoKeyError(stamp, !kind));
        const key = kind === 0 ? new SaveKey(keyData) : new BattleVideoKey(keyData);
        key.setKeyStore(keyStore)
        openKeys[stamp] = key;
        resolve(key);
      };
      request.onerror = (e) => {
        reject(e);
      };
    }) as Promise<BattleVideoKey | SaveKey>;
  }

  getSaveKey(stamp: string) {
    return this.getKey(stamp, 0) as Promise<SaveKey>;
  }

  getBvKey(stamp: string) {
    return this.getKey(stamp, 1) as Promise<BattleVideoKey>;
  }

  private async setKey(key: SaveKey | BattleVideoKey, kind: number) {
    await this.waitForOpen();

    const storeName = kind === 0 ? 'save-keys' : 'bv-keys';
    const openKeys = kind === 0 ? this.openSavKeys : this.openBvKeys;    
    const keyStore: KeyStore = this;

    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(key.keyData, key.stamp);
    return new Promise((resolve, reject) => {
      request.onsuccess = (e) => {
        openKeys[key.stamp] = key;
        key.setKeyStore(keyStore);
        resolve();
      };
      request.onerror = (e) => {
        reject(e);
      };
    }) as Promise<void>;
  }

  setSaveKey(key: SaveKey) {
    return this.setKey(key, 0);
  }

  setBvKey(key: BattleVideoKey) {
    return this.setKey(key, 1);
  }

  private async setOrMergeKey(key: SaveKey | BattleVideoKey, kind: number) {
    await this.waitForOpen();

    try {
      const storedKey = await this.getKey(key.stamp, kind);
      (storedKey as any).mergeKey(key);
      storedKey.persist();
    } catch (e) {
      if (e.name !== 'NoKeyError')
        throw e;
      return;
    }
    this.setKey(key, kind);
  }

  setOrMergeSaveKey(key: SaveKey) {
    return this.setOrMergeKey(key, 0);
  }

  setOrMergeBvKey(key: BattleVideoKey) {
    return this.setOrMergeKey(key, 1);
  }

  private async persistKey(key: BattleVideoKey | SaveKey, kind: number) {
    await this.waitForOpen();

    const storeName = kind === 0 ? 'save-keys' : 'bv-keys';
    const openKeys = kind === 0 ? this.openSavKeys : this.openBvKeys;    

    const storedKey = await this.getKey(key.stamp, kind);
    if (storedKey !== key)
      throw createNotStoredKeyError(key.stamp, !kind);

    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(key.keyData, key.stamp);
    return new Promise((resolve, reject) => {
      request.onsuccess = (e) => {
        resolve();
      };
      request.onerror = (e) => {
        reject(e);
      };
    }) as Promise<void>;
  }

  persistSaveKey(key: SaveKey) {
    return this.persistKey(key, 0);
  }

  persistBvKey(key: BattleVideoKey) {
    return this.persistKey(key, 1);
  }
}