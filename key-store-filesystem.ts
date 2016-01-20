/// <reference path="typings/bluebird/bluebird.d.ts"/>
/// <reference path="typings/node/node.d.ts"/>

import * as Promise from "bluebird";
import * as fs from "fs";
import KeyStore from "./key-store";
import { join } from "path";
import SaveKey from "./save-key";
import { getStamp } from "./util";

var readdirAsync = Promise.promisify(fs.readdir),
    statAsync = Promise.promisify(fs.stat),
    openAsync = Promise.promisify(fs.open),
    readAsync = Promise.promisify(fs.read),
    writeAsync = <any>Promise.promisify(fs.write),
    closeAsync = Promise.promisify(fs.close);

class LazyValue<T> {
    private evaluated = false;
    private value: T;

    constructor(private fun: () => Promise<T>) {}

    async get(): Promise<T> {
        if (!this.evaluated) {
            this.value = await this.fun();
        }
        return this.value;
    }

    get isInitialized() {
        return this.evaluated;
    }
}

export default class KeyStoreFileSystem implements KeyStore {
    private scan: Promise<void>;
    private keys: { [stamp: string]: { fd: number,
                                       name: string,
                                       isSav: boolean,
                                       key: LazyValue<Uint8Array|SaveKey> } }
        = {};

    constructor(private path: string) {
        this.scan = this.scanSaveDirectory(this.path);
    }

    private async scanSaveDirectory(path: string): Promise<void> {
        for (let fileName of await readdirAsync(path)) {
            let stats = await statAsync(join(path, fileName));
            if (!(stats.size === 0xB4AD4 || stats.size === 0x80000 || stats.size === 0x1000)) {
                continue;
            }
            let fd = <number>(await openAsync(join(path, fileName), 'r+'));
            let buf = new Buffer(8);
            await readAsync(fd, buf, 0, 8, 0);
            let stamp = getStamp(buf, 0);
            if (this.keys[stamp] !== undefined) {
                continue;
            }
            this.keys[stamp] = {
                fd: fd,
                name: fileName,
                isSav: stats.size !== 0x1000,
                key: new LazyValue(async function() {
                    var size = stats.size === 0x1000 ? 0x1000 : 0xB4AD4;
                    var buf = new Buffer(stats.size);
                    await readAsync(fd, buf, 0, stats.size, 0);
                    var ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
                    var ui8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
                    return stats.size !== 0x1000 ? new SaveKey(ui8) : ui8;
                })
            }
        }
    }

    private async getKey(stamp: string, isSav: boolean): Promise<SaveKey|Uint8Array> {
        if (this.keys[stamp] !== undefined) {
            if (this.keys[stamp].isSav === isSav) {
                return await this.keys[stamp].key.get();
            }
            return undefined;
        } else {
            await (this.scan.isFulfilled() ? (this.scan = this.scanSaveDirectory(this.path)) : this.scan);
            if (this.keys[stamp] !== undefined && this.keys[stamp].isSav === isSav) {
                return await this.keys[stamp].key.get();
            }
            return undefined;
        }
    }

    async getSaveKey(stamp: string): Promise<SaveKey> {
        return <Promise<SaveKey>>this.getKey(stamp, true);
    }

    async getBvKey(stamp: string): Promise<Uint8Array> {
        return <Promise<Uint8Array>>this.getKey(stamp, false);
    }

    async close() {
        for (let key in this.keys) {
            let lazyKey = this.keys[key];
            if (lazyKey.isSav && lazyKey.key.isInitialized) {
                let buf = new Buffer((<SaveKey>(await lazyKey.key.get())).keyData);
                await writeAsync(lazyKey.fd, buf, 0, buf.length, 0);
                fs.close(lazyKey.fd);
            }
        }
    }
}
