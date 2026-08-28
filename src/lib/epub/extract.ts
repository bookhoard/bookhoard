import { unzipSync } from "fflate";

/** Every file in the archive, keyed by its path inside the zip. */
export function extractAllEpubFiles(buffer: Buffer): Record<string, Uint8Array> {
  return unzipSync(new Uint8Array(buffer));
}
