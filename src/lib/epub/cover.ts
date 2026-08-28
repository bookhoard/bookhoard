import { posix } from "node:path";
import { unzipSync } from "fflate";
import type { EpubMetadata } from "./metadata";

export interface EpubCover {
  data: Buffer;
  contentType: string;
  extension: string;
}

export function extractEpubCover(
  buffer: Buffer,
  metadata: EpubMetadata
): EpubCover | null {
  if (!metadata.coverId) return null;
  const item = metadata.manifest[metadata.coverId];
  if (!item) return null;

  const coverPath = posix
    .normalize(metadata.opfDir + decodeURIComponent(item.href))
    .replace(/^\.\//, "");

  const files = unzipSync(new Uint8Array(buffer), {
    filter: (file) => file.name === coverPath,
  });
  const data = files[coverPath];
  if (!data) return null;

  const extension = item.mediaType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  return { data: Buffer.from(data), contentType: item.mediaType, extension };
}
