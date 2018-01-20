import KeyStore, { getStampAndKindFromKey, createNoKeyError, createNotStoredKeyError } from "./key-store";
import SaveKey from "./save-key";
import { createUint8Array, createBuffer, promisify } from "./util";
import BattleVideoKey from "./battle-video-key";
import { Hash } from "crypto";

let fs: any;
try {
  fs = require("fs");
} catch (e) {
  fs = {};
}
let createHash: (algorithm: string) => Hash;
try {
  createHash = require("crypto").createHash;
} catch (e) {
  createHash = () => undefined;
}
let join: (...paths: string[]) => string;
try {
  join = require("path").join;
} catch (e) {
  join = (...args) => args.join("/");
}

interface Stats {
  isFile(): boolean;
  isDirectory(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  blksize: number;
  blocks: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;
}

var readdirAsync = promisify(fs.readdir as (
    path: string,
    callback: (err: NodeJS.ErrnoException, files: string[]) => void
  ) => void),
  statAsync = promisify(fs.stat as (
    path: string,
    callback: (err: NodeJS.ErrnoException, stats: Stats) => void
  ) => void),
  openAsync = promisify(fs.open as (
    path: string,
    mode: string | number | undefined | null,
    callback: (err: NodeJS.ErrnoException, fd: number) => void
  ) => void),
  readAsync = promisify(fs.read as <TBuffer extends Buffer | Uint8Array>(
    fd: number,
    buffer: TBuffer,
    offset: number,
    length: number,
    position: number | null,
    callback?: (err: NodeJS.ErrnoException, bytesRead: number, buffer: TBuffer) => void
  ) => void),
  writeAsync = promisify(fs.write as (
    fd: number,
    buf: Buffer,
    offset: number,
    length: number,
    position: number,
    callback: (err: Error) => void
  ) => void),
  closeAsync = promisify(fs.close as (fd: number, callback: (err: NodeJS.ErrnoException) => void) => void),
  unlinkAsync = promisify(fs.unlink as (path: string, callback: (err: NodeJS.ErrnoException) => void) => void);

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

/**
 * An implementation of a [[KeyStore]] that saves all keys to a folder on the hard drive.
 */
export default class KeyStoreFileSystem implements KeyStore {
  private isScanning: boolean = false;
  private scan: Promise<void>;
  private keys: {
    [stamp: string]: {
      fd: number;
      name: string;
      kind: number;
      key: LazyValue<{ key: BattleVideoKey | SaveKey; hash: string }>;
    };
  } = {};

  /**
   * Create a new [[KeyStoreFilesystem]] that stores its data in the given directory. No other data should be saved
   * there.
   *
   * @param path The directory to save the key files in.
   */
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
      const fd = <number>await openAsync(join(path, fileName), "r+");
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
          } catch (e) {}
          await closeAsync(fd);
          await unlinkAsync(join(path, fileName));
          continue;
        } catch (e) {
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
          var hash = createHash("sha256")
            .update(buf)
            .digest("hex");
          const res = {
            key: kind === 0 ? new SaveKey(ui8) : new BattleVideoKey(ui8),
            hash: hash,
          };
          res.key.setKeyStore(this);
          return res;
        }),
      };
    }
    this.isScanning = false;
  }

  private async getKey(stamp: string, kind: number): Promise<SaveKey | BattleVideoKey> {
    if (this.keys[stamp] !== undefined) {
      if (this.keys[stamp].kind === kind) {
        try {
          return (await this.keys[stamp].key.get()).key;
        } catch (e) {
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
    return (await this.getKey(stamp, 0)) as SaveKey;
  }

  async getBvKey(stamp: string): Promise<BattleVideoKey> {
    return (await this.getKey(stamp, 1)) as BattleVideoKey;
  }

  async close() {
    for (let key in this.keys) {
      if (!this.keys.hasOwnProperty(key)) continue;
      let lazyKey = this.keys[key];
      if (lazyKey.key.isInitialized) {
        let key = await lazyKey.key.get();
        if (
          key.hash !==
          createHash("sha256")
            .update(createBuffer(key.key.keyData))
            .digest("hex")
        ) {
          let buf = createBuffer(key.key.keyData);
          await writeAsync(lazyKey.fd, buf, 0, buf.length, 0);
        }
      }
      await closeAsync(lazyKey.fd);
    }
  }

  async setKey(name: string, key: BattleVideoKey | SaveKey, kind: number) {
    try {
      var stamp = key.stamp;
      if (this.keys[stamp] !== undefined) {
        await closeAsync(this.keys[stamp].fd);
        await unlinkAsync(join(this.path, this.keys[stamp].name));
      }
      var buf = createBuffer(key.keyData);
      var hash = createHash("sha256")
        .update(buf)
        .digest("hex");
      var fd = <number>await openAsync(join(this.path, name), "w+");
      await writeAsync(fd, buf, 0, buf.length, 0);
      this.keys[stamp] = {
        fd: fd,
        name: name,
        kind,
        key: new LazyValue(async function() {
          return { key: key, hash: hash };
        }),
      };
      key.setKeyStore(this);
    } catch (e) {
      let error = new Error("There was an error saving the key.") as any;
      error.name = "KeySavingError";
      error.context = e;
      throw error;
    }
  }

  async setBvKey(key: BattleVideoKey) {
    await this.setKey(`BV Key - ${key.stamp.replace(/\//g, "-")}.bin`, key, 1);
  }

  async setSaveKey(key: SaveKey) {
    await this.setKey(`SAV Key - ${key.stamp.replace(/\//g, "-")}.bin`, key, 0);
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

  private async persist(key: SaveKey | BattleVideoKey, kind: number) {
    const storedKey = this.keys[key.stamp];
    if (storedKey === undefined) throw createNoKeyError(key.stamp, !kind);

    if (storedKey.kind !== kind) throw createNoKeyError(key.stamp, !kind);

    if (!storedKey.key.isInitialized) throw createNotStoredKeyError(key.stamp, !kind);

    if ((await storedKey.key.get()).key !== key) throw createNotStoredKeyError(key.stamp, !kind);

    const buf = createBuffer(key.keyData);
    const hash = createHash("sha256")
      .update(buf)
      .digest("hex");
    (await storedKey.key.get()).hash = hash;
    var fd = <number>await openAsync(join(this.path, name), "w+");
    await writeAsync(fd, buf, 0, buf.length, 0);
  }

  async persistSaveKey(key: SaveKey) {
    return await this.persist(key, 0);
  }

  async persistBvKey(key: BattleVideoKey) {
    return await this.persist(key, 1);
  }
}
