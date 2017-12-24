import SaveKey from "./save-key";
import BattleVideoKey from "./battle-video-key";

export default class KeyStoreMemory {
    private saveKeys: { [stamp: string]: SaveKey } = {};
    private bvKeys: { [stamp: string]: BattleVideoKey } = {};

    getSaveKey(stamp: string) {
        if (this.saveKeys[stamp] !== undefined)
            return Promise.resolve(this.saveKeys[stamp]);
        return Promise.reject({ name: "NoKeyAvailableError" });
    }

    getBvKey(stamp: string) {
        if (this.bvKeys[stamp] !== undefined)
            return Promise.resolve(this.bvKeys[stamp]);
        return Promise.reject({ name: "NoKeyAvailableError" });
    }

    setSaveKey(key) {
        this.saveKeys[key.stamp] = key;
    }

    setBvKey(key) {
        this.bvKeys[key.stamp] = key;
    }
}