import { Readable } from "node:stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageDriver } from "./types";

export interface S3DriverConfig {
  endpoint?: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  forcePathStyle?: boolean;
  /** Scopes every key under this directory — for sharing a bucket with other apps. */
  prefix?: string;
}

export class S3Driver implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  /** Empty, or normalized to a single trailing slash (e.g. "bookhoard/"). */
  private prefix: string;

  constructor(config: S3DriverConfig) {
    this.bucket = config.bucket;
    const trimmed = config.prefix?.replace(/^\/+|\/+$/g, "") ?? "";
    this.prefix = trimmed ? `${trimmed}/` : "";
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region ?? "auto",
      forcePathStyle: config.forcePathStyle ?? true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /** Every StorageDriver method below takes/returns keys relative to `prefix` — this is the only place that adds it back. */
  private resolveKey(key: string): string {
    return this.prefix + key;
  }

  async put(key: string, body: Readable | Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.resolveKey(key),
        Body: body,
        ContentType: contentType,
      })
    );
  }

  async get(key: string): Promise<Readable> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.resolveKey(key) })
    );
    return res.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: this.resolveKey(key) })
    );
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: this.resolveKey(prefix),
          ContinuationToken: continuationToken,
        })
      );
      for (const obj of res.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key.slice(this.prefix.length));
      }
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: this.resolveKey(key) })
      );
      return true;
    } catch {
      return false;
    }
  }

  async signedUrl(key: string, ttl: number): Promise<string | null> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: this.resolveKey(key) });
    return getSignedUrl(this.client, command, { expiresIn: ttl });
  }
}
