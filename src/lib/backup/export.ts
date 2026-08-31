import { Zip, ZipPassThrough } from "fflate";
import { getStorage } from "@/lib/storage";

export interface BackupOptions {
  /** Include book.epub/cover/content bytes, not just metadata.json. */
  includeFiles: boolean;
}

/** Matches the per-book binary keys written in POST /api/books and the
 * metadata route's cover upload — everything under books/<id>/ except
 * metadata.json itself. */
const BOOK_FILE_RE = /^books\/[^/]+\/(book\.epub|cover\.[^/]+|content\/.*)$/;

/**
 * Streams the whole library as a zip whose internal paths exactly mirror
 * storage keys — so a manual restore is just "unzip into the storage root".
 * Uses fflate's streaming Zip/ZipPassThrough (not zipSync) so memory stays
 * flat regardless of library size; EPUB/cover bytes are stored, not
 * re-deflated, since they're already compressed.
 */
export function createBackupStream({ includeFiles }: BackupOptions): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const storage = getStorage();
      const zip = new Zip((err, chunk, final) => {
        if (err) {
          controller.error(err);
          return;
        }
        if (chunk) controller.enqueue(chunk);
        if (final) controller.close();
      });

      try {
        const allKeys = await storage.list("");
        const keys = includeFiles ? allKeys : allKeys.filter((key) => !BOOK_FILE_RE.test(key));

        for (const key of keys) {
          const file = new ZipPassThrough(key);
          zip.add(file);
          const nodeStream = await storage.get(key);
          for await (const chunk of nodeStream) {
            file.push(chunk as Buffer, false);
          }
          file.push(new Uint8Array(0), true);
        }
        zip.end();
      } catch (err) {
        controller.error(err instanceof Error ? err : new Error(String(err)));
      }
    },
  });
}
