import SaveKey from "./save-key";
import BattleVideoKey from "./battle-video-key";
import { KeyStore, createNoKeyError, createNotStoredKeyError } from "./key-store";

export default class KeyStoreMemory implements KeyStore {
  private saveKeys: { [stamp: string]: SaveKey } = {};
  private bvKeys: { [stamp: string]: BattleVideoKey } = {};

  getSaveKey(stamp: string) {
    if (this.saveKeys[stamp] !== undefined) return Promise.resolve(this.saveKeys[stamp]);
    return Promise.reject(createNoKeyError(stamp, true));
  }

  getBvKey(stamp: string) {
    if (this.bvKeys[stamp] !== undefined) return Promise.resolve(this.bvKeys[stamp]);
    return Promise.reject(createNoKeyError(stamp, true));
  }

  setSaveKey(key: SaveKey) {
    this.saveKeys[key.stamp] = key;
    key.setKeyStore(this);
    return Promise.resolve();
  }

  setOrMergeSaveKey(key: SaveKey) {
    if (this.saveKeys[key.stamp])
      this.saveKeys[key.stamp].mergeKey(key);
    else
      this.setSaveKey(key);
    return Promise.resolve();
  }

  setBvKey(key) {
    this.bvKeys[key.stamp] = key;
    key.setKeyStore(this);
    return Promise.resolve();
  }

  setOrMergeBvKey(key: BattleVideoKey) {
    if (this.bvKeys[key.stamp])
      this.bvKeys[key.stamp].mergeKey(key);
    else
      this.setBvKey(key);
    return Promise.resolve();
  }

  persistSaveKey(key: SaveKey) {
    return this.getSaveKey(key.stamp).then(storedKey => {
      if (key !== storedKey)
        throw createNotStoredKeyError(key.stamp, true);
    });
  }

  persistBvKey(key: BattleVideoKey) {
    return this.getBvKey(key.stamp).then(storedKey => {
      if (key !== storedKey)
        throw createNotStoredKeyError(key.stamp, false);
    });
  }
}
