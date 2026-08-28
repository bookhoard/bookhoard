import { Readable } from "node:stream";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, readdir, rename, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { pipeline } from "node:stream/promises";
import type { StorageDriver } from "./types";

export class LocalDriver implements StorageDriver {
  constructor(private root: string) {}

  private resolve(key: string): string {
    return join(this.root, key);
  }

  async put(key: string, body: Readable | Buffer, _contentType: string): Promise<void> {
    const dest = this.resolve(key);
    const tmp = `${dest}.tmp`;
    await mkdir(dirname(dest), { recursive: true });

    const source = Buffer.isBuffer(body) ? Readable.from(body) : body;
    await pipeline(source, createWriteStream(tmp));
    // atomic on POSIX: rename() replaces the destination in one step,
    // so a crash mid-write never leaves a truncated file at `key`.
    await rename(tmp, dest);
  }

  async get(key: string): Promise<Readable> {
    return createReadStream(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  async list(prefix: string): Promise<string[]> {
    const base = this.resolve(prefix);
    const keys: string[] = [];

    async function walk(dir: string): Promise<void> {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (!entry.name.endsWith(".tmp")) {
          keys.push(full);
        }
      }
    }

    await walk(base);
    return keys.map((k) => relative(this.root, k).split("\\").join("/"));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async signedUrl(_key: string, _ttl: number): Promise<string | null> {
    return null;
  }
}
