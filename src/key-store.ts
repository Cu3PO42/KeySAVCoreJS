import SaveKey from "./save-key";
import BattleVideoKey from "./battle-video-key";
import { createDataView, getStampSav, getStampBv } from "./util";

/**
 * An object that stores any amount of keys for battle videos and saves and can be used to retrieve them.
 */
export interface KeyStore {
  /**
   * Get a promise for save key for the given stamp if available, undefined otherwise.
   *
   * @param stamp The stamp that identifies the save
   * @return A promise for the save key, if available
   */
  getSaveKey(stamp: string): Promise<SaveKey>;

  /**
   * Get a promise for a battle video key for the given stamp if available, undefined otherwise.
   *
   * @param stamp The stamp that identifies the battle video
   * @return A promise for the battle video key, if available
   */
  getBvKey(stamp: string): Promise<BattleVideoKey>;

  /**
   * Set a save key. The returned promise is resolved upon completion.
   *
   * @param key The save key to set
   * @return A promise that resolves when the operation is complete
   */
  setSaveKey(key: SaveKey): Promise<void>;

  /**
   * Set a given save key if a key for the save is not already available. Otherwise merge the given key with the
   * existing one.
   *
   * @param key The save key to set or merge
   * @return A promise that resolves when the operation is complete
   */
  setOrMergeSaveKey(key: SaveKey): Promise<void>;

  /**
   * Set a battle video key. The returned promise is resolved upon completion.
   *
   * @param key The battle video key to set
   * @return A promise that resolves when the operation is complete
   */
  setBvKey(key: BattleVideoKey): Promise<void>;

  /**
   * Set a given battle video key if a key for the save is not already available. Otherwise merge the given key with
   * the existing one.
   *
   * @param key The battle video key to set or merge
   * @return A promise that resolves when the operation is complete
   */
  setOrMergeBvKey(key: BattleVideoKey): Promise<void>;

  /**
   * Write a key that has already been added to the store to persistent storage.
   *
   * @param key The key to persist
   */
  persistSaveKey(key: SaveKey): Promise<void>;

  /**
   * Write a key that has already been added to the store to persistent storage.
   *
   * @param key The key to persist
   */
  persistBvKey(key: BattleVideoKey): Promise<void>;
}

var currentKeyStore: KeyStore = undefined;

/**
 * Set the global key store. It is used by utility functions to store and retrieve keys for provided saves and
 * battle videos.
 *
 * @param store The key store to be used globally
 */
export function setKeyStore(store: KeyStore): void {
  currentKeyStore = store;
}

/**
 * Return the global key store.
 *
 * @return The global key store.
 */
export function getKeyStore(): KeyStore {
  return currentKeyStore;
}

export default KeyStore;

/**
 * Extract the stamp and key variation (save or battle video) from the first 0x18 bytes of a key and the file size.
 *
 * @param arr The first 0x18 byteo of the key
 * @param size The complete size of the key file
 * @return an object containing the stamp for the key and the kind: 0 for saves, 1 for battle videos
 */
export function getStampAndKindFromKey(arr: Uint8Array, size: number): { stamp: string; kind: number } {
  const dataView = createDataView(arr);
  if (dataView.getUint32(0x10, true) === 0xcafebabe) {
    switch (dataView.getUint16(0x14, true)) {
      case 0:
        return { stamp: getStampSav(arr, 0), kind: 0 };
      case 1:
        return { stamp: getStampBv(arr, 0), kind: 1 };
      default:
        return { stamp: "", kind: -1 };
    }
  }

  if (size === 0x80000 || size === 0xb4ad4) {
    return { stamp: getStampSav(arr, 0), kind: 0 };
  }

  if (size === 0x1000) {
    return { stamp: getStampBv(arr, 0), kind: 1 };
  }

  return { stamp: "", kind: -1 };
}

export function createNoKeyError(stamp: string, isSav: boolean): Error {
  let e = new Error(`No key for ${isSav ? "save" : "battle video"} with stamp ${stamp} available.`) as any;
  e.name = "NoKeyAvailableError";
  e.stamp = stamp;
  e.keyType = isSav ? "SAV" : "BV";
  return e;
}

export function createNotStoredKeyError(stamp: string, isSav: boolean): Error {
  let e = new Error(
    `The stored key for ${isSav ? "save" : "battle video"} with stamp ${stamp} is not the same as passed to persist.`
  ) as any;
  e.name = "NotStoredKeyError";
  e.stamp = stamp;
  e.keyType = isSav ? "SAV" : "BV";
  return e;
}
