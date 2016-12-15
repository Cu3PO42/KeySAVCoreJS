import * as fs from "fs";
import { createHash } from "crypto";
import KeyStore, { getStampAndKindFromKey } from "./key-store";
import { join } from "path";
import SaveKey from "./save-key";
import {createUint8Array, createBuffer, promisify} from "./util";
import BattleVideoKey from "./battle-video-key";

var readdirAsync = promisify(fs.readdir),
    statAsync = promisify(fs.stat),
    openAsync = promisify(fs.open),
    readAsync = promisify(fs.read),
    writeAsync = promisify(fs.write as (fd: number, buf: Buffer, offset: number, length: number, position: number, callback: (err: Error) => void) => void),
    closeAsync = promisify(fs.close),
    unlinkAsync = promisify(fs.unlink);

class LazyValue<T> {
    private evaluated = false;
    private value: T;

    constructor(private fun: () => Promise<T>) {}

    async get(): Promise<T> {
        if (!this.evaluated) {
            this.value = await this.fun();
            this.evaluated = true;
        }
        return this.value;
    }

    get isInitialized() {
        return this.evaluated;
    }
}

function createNoKeyError(stamp: string, isSav: boolean) {
    var e = new Error(`No key for ${isSav ? "save" : "battle video"} with stamp ${stamp} available.`) as any;
    e.name = "NoKeyAvailableError";
    e.stamp = stamp;
    e.keyType = isSav ? "SAV" : "BV";
    return e;
}

export default class KeyStoreFileSystem implements KeyStore {
    private isScanning: boolean = false;
    private scan: Promise<void>;
    private keys: { [stamp: string]: { fd: number,
                                       name: string,
                                       kind: number,
                                       key: LazyValue<{ key: BattleVideoKey|SaveKey, hash: string }> } } = {};

    constructor(private path: string) {
        this.scan = this.scanSaveDirectory(this.path);
    }

    private async scanSaveDirectory(path: string): Promise<void> {
        this.isScanning = true;
        for (let fileName of await readdirAsync(path)) {
            const stats = await statAsync(join(path, fileName));
            if (stats.isDirectory()) {
                continue;
            }
            const fd = <number>(await openAsync(join(path, fileName), 'r+'));
            const buf = new Buffer(0x18);
            await readAsync(fd, buf, 0, 0x18, 0);
            const { stamp, kind } = getStampAndKindFromKey(createUint8Array(buf), stats.size);
            if (!~kind) {
                continue;
            }
            if (this.keys[stamp] !== undefined && this.keys[stamp].name !== fileName) {
                let key;
                try {
                    key = (await this.keys[stamp].key.get()).key;
                    try {
                        const buf = new Buffer(stats.size);
                        await readAsync(fd, buf, 0, stats.size, 0);
                        switch (kind) {
                            case 0:
                                (key as SaveKey).mergeKey(new SaveKey(createUint8Array(buf)));
                                break;
                            case 1:
                                (key as BattleVideoKey).mergeKey(new BattleVideoKey(createUint8Array(buf)));
                                break;
                        }
                    } catch(e) { }
                    await closeAsync(fd);
                    await unlinkAsync(join(path, fileName));
                    continue;
                } catch(e) {
                    await closeAsync(this.keys[stamp].fd);
                    await unlinkAsync(join(this.path, this.keys[stamp].name));
                    delete this.keys[stamp];
                }
            }
            this.keys[stamp] = {
                fd: fd,
                name: fileName,
                kind,
                key: new LazyValue(async function() {
                    const buf = new Buffer(stats.size);
                    await readAsync(fd, buf, 0, stats.size, 0);
                    const ui8 = createUint8Array(buf);
                    var hash = createHash('sha256').update(buf).digest('hex');
                    return {
                        key: kind === 0 ? new SaveKey(ui8) : new BattleVideoKey(ui8),
                        hash: hash
                    };
                })
            }
        }
        this.isScanning = false;
    }

    private async getKey(stamp: string, kind: number): Promise<SaveKey|BattleVideoKey> {
        if (this.keys[stamp] !== undefined) {
            if (this.keys[stamp].kind === kind) {
                try {
                    return (await this.keys[stamp].key.get()).key;
                } catch(e) {
                    await closeAsync(this.keys[stamp].fd);
                    await unlinkAsync(join(this.path, this.keys[stamp].name));
                    delete this.keys[stamp];
                }
            } else {
                throw createNoKeyError(stamp, kind === 0);
            }
        } else {
            if (!this.isScanning) {
                this.scan = this.scanSaveDirectory(this.path);
            }
            await this.scan;
            if (this.keys[stamp] !== undefined && this.keys[stamp].kind === kind) {
                return (await this.keys[stamp].key.get()).key;
            }
            throw createNoKeyError(stamp, kind === 0);
        }
    }

    async getSaveKey(stamp: string): Promise<SaveKey> {
        return await this.getKey(stamp, 0) as SaveKey;
    }

    async getBvKey(stamp: string): Promise<BattleVideoKey> {
        return await this.getKey(stamp, 1) as BattleVideoKey;
    }

    async close() {
        for (let key in this.keys) {
            if (!this.keys.hasOwnProperty(key))
                continue;
            let lazyKey = this.keys[key];
            if (lazyKey.key.isInitialized) {
                let key = await lazyKey.key.get();
                if (key.hash !== createHash("sha256").update(createBuffer(key.key.keyData)).digest("hex")) {
                    let buf = createBuffer(key.key.keyData);
                    await writeAsync(lazyKey.fd, buf, 0, buf.length, 0);
                }
            }
            await closeAsync(lazyKey.fd);
        }
    }

    async setKey(name: string, key: BattleVideoKey|SaveKey, kind: number) {
        try {
            var stamp = key.stamp;
            if (this.keys[stamp] !== undefined) {
                await closeAsync(this.keys[stamp].fd);
                await unlinkAsync(join(this.path, this.keys[stamp].name));
            }
            var buf = createBuffer(key.keyData);
            var hash = createHash("sha256").update(buf).digest("hex");
            var fd = <number>(await openAsync(join(this.path, name), "w+"));
            await writeAsync(fd, buf, 0, buf.length, 0);
            this.keys[stamp] = {
                fd: fd,
                name: name,
                kind,
                key: new LazyValue(async function() { return { key: key, hash: hash }; })
            };
        } catch(e) {
            var e = new Error("There was an error saving the key.") as any;
            e.name = "KeySavingError";
            throw e;
        }
    }

    async setBvKey(key: BattleVideoKey) {
        await this.setKey(`BV Key - ${key.stamp.replace('/', '-')}.bin`, key, 1);
    }

    async setSaveKey(key: SaveKey) {
        await this.setKey(`SAV Key - ${key.stamp.replace('/', '-')}.bin`, key, 0);
    }

    async setOrMergeBvKey(key: BattleVideoKey) {
        try {
            const oldKey = await this.getBvKey(key.stamp);
            oldKey.mergeKey(key);
        } catch (e) {
            await this.setBvKey(key);
        }
    }

    async setOrMergeSaveKey(key: SaveKey) {
        try {
            const oldKey = await this.getSaveKey(key.stamp);
            oldKey.mergeKey(key);
        } catch (e) {
            await this.setSaveKey(key);
        }
    }
}
