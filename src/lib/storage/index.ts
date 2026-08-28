import { S3Driver } from "./s3";
import { LocalDriver } from "./local";
import { R2Driver } from "./r2";
import type { StorageDriver } from "./types";

export type { StorageDriver } from "./types";

let driver: StorageDriver | null = null;

function createDriver(): StorageDriver {
  const kind = process.env.STORAGE_DRIVER ?? "local";

  if (kind === "s3") {
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "STORAGE_DRIVER=s3 requires S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY"
      );
    }
    return new S3Driver({
      endpoint: process.env.S3_ENDPOINT,
      bucket,
      accessKeyId,
      secretAccessKey,
      region: process.env.S3_REGION,
      prefix: process.env.S3_PREFIX,
    });
  }

  // Cloudflare Workers deployment (e.g. the demo) — native R2 binding
  // instead of the AWS SDK, which doesn't run in the Workers runtime. The
  // Cloudflare build also aliases @aws-sdk/* to a stub (see next.config.ts)
  // so this branch's S3Driver import doesn't bloat the Workers bundle.
  if (kind === "r2") {
    const binding = process.env.R2_BUCKET_BINDING ?? "BOOKHOARD_BUCKET";
    return new R2Driver({ binding, prefix: process.env.S3_PREFIX });
  }

  return new LocalDriver(process.env.LOCAL_STORAGE_PATH ?? "./.data");
}

/** Singleton so both drivers reuse one client/connection across the app. */
export function getStorage(): StorageDriver {
  if (!driver) {
    driver = createDriver();
  }
  return driver;
}
