import type { Readable } from "node:stream";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { StorageDriver } from "./types";

/**
 * Minimal local shape of the subset of Cloudflare's global R2Bucket API we
 * use — kept local (not the ambient global R2Bucket/R2Objects types) so this
 * file doesn't need cloudflare-env.d.ts in scope, which would leak Workers'
 * stricter Response typings into the rest of the app (see tsconfig.json).
 */
interface R2ObjectMeta {
  key: string;
}
interface R2ObjectBody extends R2ObjectMeta {
  body: ReadableStream;
}
interface R2ListResult {
  objects: R2ObjectMeta[];
  truncated: boolean;
  cursor?: string;
}
interface R2BucketBinding {
  put(key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  head(key: string): Promise<R2ObjectMeta | null>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string }): Promise<R2ListResult>;
}

/**
 * Native R2 binding driver — used only for the Cloudflare Workers demo
 * deployment. The AWS SDK's S3Driver doesn't work there: its credential/
 * region resolution chain calls fs.readFile (probing ~/.aws/config) even
 * with static credentials provided, and Workers' Node-compat shim throws
 * on that instead of failing gracefully like a real missing file would.
 * R2's native binding API sidesteps the AWS SDK — and HTTP signing —
 * entirely, which is also the officially recommended way to talk to R2
 * from inside a Worker.
 */
export interface R2DriverConfig {
  /** Binding name declared in wrangler.jsonc's `r2_buckets`, e.g. "BOOKHOARD_BUCKET". */
  binding: string;
  /** Scopes every key under this directory — for sharing a bucket with other apps. */
  prefix?: string;
}

export class R2Driver implements StorageDriver {
  private bindingName: string;
  /** Empty, or normalized to a single trailing slash (e.g. "bookhoard/"). */
  private prefix: string;

  constructor(config: R2DriverConfig) {
    this.bindingName = config.binding;
    const trimmed = config.prefix?.replace(/^\/+|\/+$/g, "") ?? "";
    this.prefix = trimmed ? `${trimmed}/` : "";
  }

  private get bucket(): R2BucketBinding {
    const env = getCloudflareContext().env as unknown as Record<string, R2BucketBinding | undefined>;
    const bucket = env[this.bindingName];
    if (!bucket) {
      throw new Error(`R2 binding "${this.bindingName}" not found — check wrangler.jsonc`);
    }
    return bucket;
  }

  private resolveKey(key: string): string {
    return this.prefix + key;
  }

  async put(key: string, body: Readable | Buffer, contentType: string): Promise<void> {
    const bytes = Buffer.isBuffer(body) ? body : Buffer.concat(await collectChunks(body));
    await this.bucket.put(this.resolveKey(key), bytes, {
      httpMetadata: { contentType },
    });
  }

  async get(key: string): Promise<Readable> {
    const obj = await this.bucket.get(this.resolveKey(key));
    if (!obj) throw new Error(`Object not found: ${key}`);
    const { Readable } = await import("node:stream");
    return Readable.fromWeb(obj.body as unknown as import("node:stream/web").ReadableStream);
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(this.resolveKey(key));
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor: string | undefined;

    do {
      const res = await this.bucket.list({
        prefix: this.resolveKey(prefix),
        cursor,
      });
      for (const obj of res.objects) keys.push(obj.key.slice(this.prefix.length));
      cursor = res.truncated ? res.cursor : undefined;
    } while (cursor);

    return keys;
  }

  async exists(key: string): Promise<boolean> {
    const obj = await this.bucket.head(this.resolveKey(key));
    return obj !== null;
  }

  /** R2's native binding has no presigned-URL API — callers fall back to streaming via /api/files/[...key]. */
  async signedUrl(): Promise<string | null> {
    return null;
  }
}

async function collectChunks(stream: Readable): Promise<Buffer[]> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks;
}
