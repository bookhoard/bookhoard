// Swapped in for @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner only
// on the Cloudflare build (see next.config.ts) — s3.ts's code path is dead
// there (STORAGE_DRIVER is always "r2"), but the real AWS SDK is ~3.7MB and
// blows past the Workers script size limit if it's bundled anyway.
class Unavailable {
  constructor() {
    throw new Error("AWS SDK is not available in the Cloudflare build — use STORAGE_DRIVER=r2");
  }
}

export const S3Client = Unavailable;
export const PutObjectCommand = Unavailable;
export const GetObjectCommand = Unavailable;
export const DeleteObjectCommand = Unavailable;
export const ListObjectsV2Command = Unavailable;
export const HeadObjectCommand = Unavailable;
export function getSignedUrl(): Promise<string> {
  throw new Error("AWS SDK is not available in the Cloudflare build — use STORAGE_DRIVER=r2");
}
