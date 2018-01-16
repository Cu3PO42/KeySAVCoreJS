import SaveKey from "./save-key";
import BattleVideoKey from "./battle-video-key";
import { KeyStore } from "./key-store";

export default class KeyStoreMemory implements KeyStore {
  private saveKeys: { [stamp: string]: SaveKey } = {};
  private bvKeys: { [stamp: string]: BattleVideoKey } = {};

  getSaveKey(stamp: string) {
    if (this.saveKeys[stamp] !== undefined) return Promise.resolve(this.saveKeys[stamp]);
    return Promise.reject({ name: "NoKeyAvailableError" });
  }

  getBvKey(stamp: string) {
    if (this.bvKeys[stamp] !== undefined) return Promise.resolve(this.bvKeys[stamp]);
    return Promise.reject({ name: "NoKeyAvailableError" });
  }

  setSaveKey(key: SaveKey) {
    this.saveKeys[key.stamp] = key;
    return Promise.resolve();
  }

  setOrMergeSaveKey(key: SaveKey) {
    if (this.saveKeys[key.stamp])
      this.saveKeys[key.stamp].mergeKey(key);
    else
      this.saveKeys[key.stamp] = key;
    return Promise.resolve();
  }

  setBvKey(key) {
    this.bvKeys[key.stamp] = key;
    return Promise.resolve();
  }

  setOrMergeBvKey(key: BattleVideoKey) {
    if (this.bvKeys[key.stamp])
      this.bvKeys[key.stamp].mergeKey(key);
    else
      this.bvKeys[key.stamp] = key;
    return Promise.resolve();
  }
}
