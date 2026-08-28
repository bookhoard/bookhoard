import type { Readable } from "node:stream";

export interface StorageDriver {
  put(key: string, body: Readable | Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
  exists(key: string): Promise<boolean>;
  /** null when the driver can't sign — caller falls back to streaming via /api/files/[...key] */
  signedUrl(key: string, ttl: number): Promise<string | null>;
}
