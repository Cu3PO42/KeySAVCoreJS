/// <reference path="typings/bluebird/bluebird.d.ts"/>
/// <reference path="typings/node/node.d.ts"/>

"use strict";

import * as Promise from "bluebird";
import * as fs from "fs";
import KeyStore from "./key-store";
import { join } from "path";
import SaveKey from "./save-key";
import Pkx from "./pkx";
import { getStamp, pad4, pad5 } from "./util";

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
            let stamp = getStamp(new Uint8Array(buf.buffer, buf.byteOffset, 8), 0);
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
            throw new Error("No key available.");
        } else {
            await (this.scan.isFulfilled() ? (this.scan = this.scanSaveDirectory(this.path)) : this.scan);
            if (this.keys[stamp] !== undefined && this.keys[stamp].isSav === isSav) {
                return await this.keys[stamp].key.get();
            }
            throw new Error("No key available.");
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

    async setKey(name: string, data: Uint8Array, keyFn: () => Promise<Uint8Array|SaveKey>, stamp: string, isSav: boolean) {
        if (this.keys[stamp] !== undefined) {
            await closeAsync(this.keys[stamp].fd);
        }
        var buf = new Buffer(data);
        var fd = <number>(await openAsync(name, "w+"));
        await writeAsync(fd, buf, 0, buf.length, 0);
        this.keys[stamp] = {
            fd: fd,
            name: name,
            isSav: isSav,
            key: new LazyValue(keyFn)
        };
    }

    async setBvKey(key: Uint8Array) {
        var stamp = getStamp(key, 0);
        this.setKey(`BV Key - ${stamp}.bin`, key, async function() { return key; }, stamp, false);
    }

    async setSaveKey(key: SaveKey, pkx: Pkx) {
        this.setKey(`SAV Key - ${pkx.ot} - (${pad5(pkx.tid)}.${pad5(pkx.sid)}) - TSV ${pad4(pkx.tsv)}.bin`, key.keyData, async function() { return key; }, key.stamp, true);
    }
}
