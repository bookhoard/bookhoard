import { Readable } from "node:stream";
import type { StorageDriver } from "./types";

/** In-memory StorageDriver for tests — no filesystem or network involved. */
export function createMemoryDriver(): StorageDriver & { files: Map<string, Buffer> } {
  const files = new Map<string, Buffer>();

  return {
    files,
    async put(key, body) {
      if (Buffer.isBuffer(body)) {
        files.set(key, body);
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of body) chunks.push(chunk as Buffer);
      files.set(key, Buffer.concat(chunks));
    },
    async get(key) {
      const data = files.get(key);
      if (!data) throw new Error(`ENOENT: no such key ${key}`);
      return Readable.from(data);
    },
    async delete(key) {
      files.delete(key);
    },
    async list(prefix) {
      return [...files.keys()].filter((key) => key.startsWith(prefix));
    },
    async exists(key) {
      return files.has(key);
    },
    async signedUrl() {
      return null;
    },
  };
}
