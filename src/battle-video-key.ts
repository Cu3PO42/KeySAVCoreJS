import { getStampBv, empty, copy, createDataView } from "./util";
import { KeyStore } from "./key-store";

/**
 * A key object that may be used for decryption of a single battle video slot.
 */
export default class BattleVideoKey {
  /**
   * The raw data for this key.
   */
  public keyData: Uint8Array;
  private _keyView: DataView;

  /**
   * The unique stamp that identifies the slot that this key is for.
   */
  get stamp(): string {
    return getStampBv(this.keyData, 0);
  }

  /**
   * The generation of the game that this key is for.
   */
  get generation(): number {
    return this._keyView.getUint32(0x18, true);
  }

  private _teamKeys: Uint8Array[];

  /**
   * The keys (xorpads) for the various teams in the battle video.
   */
  get teamKeys(): Uint8Array[] {
    return this._teamKeys;
  }

  /**
   * An array indicating which of the team keys are valid.
   */
  get workingKeys(): boolean[] {
    return this._teamKeys.map(k => !empty(k));
  }

  /**
   * Create a BattleVideoKey from existing data or an empty key.
   *
   * @param arg Existing key data or the generation the empty key is to be used for
   */
  constructor(public arg: Uint8Array | number) {
    let keyData;
    if (arg instanceof Uint8Array) {
      keyData = this.keyData = arg;
      this._keyView = createDataView(keyData);
      if (this._keyView.getUint32(0x10, true) != 0xcafebabe) {
        this.keyData = new Uint8Array(0x18 + 4 + 260 * 12);
        this._keyView = createDataView(this.keyData);
        copy(keyData, 0, this.keyData, 0, 0x10);
        this._keyView.setUint32(0x10, 0xcafebabe, true);
        this._keyView.setUint16(0x14, 1, true);
        this._keyView.setUint16(0x16, 1, true);
        this._keyView.setUint32(0x18, 6, true);
        copy(keyData, 0x100, this.keyData, 0x1c, 260 * 6);
        copy(keyData, 0x800, this.keyData, 0x1c + 260 * 6, 260 * 6);
      }
    } else {
      keyData = this.keyData = new Uint8Array(0x18 + 4 + 260 * (arg === 6 ? 12 : 24));
      this._keyView = createDataView(this.keyData);
      this._keyView.setUint32(0x10, 0xcafebabe, true);
      this._keyView.setUint16(0x14, 1, true);
      this._keyView.setUint16(0x16, 1, true);
      this._keyView.setUint32(0x18, arg, true);
    }

    if (this._keyView.getUint16(0x14, true) !== 1) {
      throw new Error("Not a battle video key.");
    }

    if (this._keyView.getUint16(0x16, true) !== 1) {
      throw new Error("Unknown key version.");
    }

    const { generation } = this;
    const payload = this.keyData.subarray(0x18);

    if (generation === 6) {
      this._teamKeys = [payload.subarray(4, 260 * 6 + 4), payload.subarray(260 * 6 + 4, 260 * 12 + 4)];
    } else if (generation === 7) {
      this._teamKeys = [
        payload.subarray(4, 260 * 6 + 4),
        payload.subarray(260 * 6 + 4, 260 * 12 + 4),
        payload.subarray(260 * 12 + 4, 260 * 18 + 4),
        payload.subarray(260 * 18 + 4, 260 * 24 + 4),
      ];
    } else {
      throw new Error("Unknown generation.");
    }
  }

  /**
   * Merge the information in the other key into this key. Any team tat is unlocked in the other key, but not this
   * one will be copied. The other key will not be modified.
   *
   * @param other Another key for the same slot as this key
   */
  mergeKey(other: BattleVideoKey) {
    if (this.stamp !== other.stamp) {
      return;
    }

    const workingKeysThis = this.workingKeys;
    const workingKeysOther = other.workingKeys;

    for (let i = 0; i < workingKeysThis.length; ++i) {
      if (!workingKeysThis[i] && workingKeysOther[i]) {
        copy(other.teamKeys[i], 0, this.teamKeys[i], 0, 260 * 6);
      }
    }
  }

  private keyStore: KeyStore;

  /**
   * Set the key store that manages this key. This method is called by the store and should not be used manually.
   *
   * @param store The owning key store
   */
  public setKeyStore(store: KeyStore) {
    this.keyStore = store;
  }

  /**
   * Persist this key to the key store. This should be called everytime the key is updated.
   */
  public persist(): Promise<void> {
    if (this.keyStore) return this.keyStore.persistBvKey(this);
    return Promise.resolve();
  }
}
