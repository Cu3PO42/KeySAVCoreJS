import { getStampBv, empty, copy, createDataView } from "./util";

export default class BattleVideoKey {
    public keyData: Uint8Array;
    public _keyView: DataView;

    get stamp(): string {
        return getStampBv(this.keyData, 0);
    }

    get generation(): number {
        return this._keyView.getUint32(0x18, true);
    }

    private _teamKeys: Uint8Array[];

    get teamKeys(): Uint8Array[] {
        return this._teamKeys;
    }

    get workingKeys(): boolean[] {
        return this._teamKeys.map(k => !empty(k));
    }

    constructor(public arg: Uint8Array | number) {
        let keyData;
        if (arg instanceof Uint8Array) {
            keyData = this.keyData = arg;
            this._keyView = createDataView(keyData);
            if (this._keyView.getUint32(0x10, true) != 0xCAFEBABE) {
                this.keyData = new Uint8Array(0x18 + 4 + 260 * 12);
                this._keyView = createDataView(this.keyData);
                copy(keyData, 0, this.keyData, 0, 0x10);
                this._keyView.setUint32(0x10, 0xCAFEBABE, true);
                this._keyView.setUint16(0x14, 1, true);
                this._keyView.setUint16(0x16, 1, true);
                this._keyView.setUint32(0x18, 6, true);
                copy(keyData, 0x100, this.keyData, 0x1C, 260 * 6);
                copy(keyData, 0x800, this.keyData, 0x1C + 260 * 6, 260 * 6);
            }
        } else {
            keyData = this.keyData = new Uint8Array(0x18 + 4 + 260 * (arg === 6 ? 12 : 24));
            this._keyView = createDataView(this.keyData);
            this._keyView.setUint32(0x10, 0xCAFEBABE, true);
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
            this._teamKeys = [payload.subarray(4, 260 * 6 + 4), payload.subarray(260 * 6 + 4, 260 * 12 + 4),
                              payload.subarray(260 * 12 + 4, 260 * 18 + 4), payload.subarray(260 * 18 + 4, 260 * 24 + 4)];
        } else {
            throw new Error("Unknown generation.");
        }
    }

    mergeKey(other: BattleVideoKey) {
        if (this.stamp !== other.stamp) {
            return;
        }

        const workingKeysThis = this.workingKeys;
        const workingKeysOther = other.workingKeys;

        for (let i = 0; i < workingKeysThis.length; ++i) {
            if (!workingKeysThis[i] && workingKeysOther[i]) {
                copy(other.teamKeys[i], 0, this.teamKeys[i], 0, 260*6);
            }
        }
    }
}
