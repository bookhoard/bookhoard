import { unzipSync } from "fflate";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDriver } from "@/lib/storage/test-helpers";

const driver = createMemoryDriver();
vi.mock("@/lib/storage", () => ({
  getStorage: () => driver,
}));

const { createBackupStream } = await import("./export");

async function collect(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

beforeEach(async () => {
  driver.files.clear();
  await driver.put("index.json", Buffer.from("[]"), "application/json");
  await driver.put("settings.json", Buffer.from("{}"), "application/json");
  await driver.put("books/dracula/metadata.json", Buffer.from("{}"), "application/json");
  await driver.put("books/dracula/book.epub", Buffer.from("epub bytes"), "application/epub+zip");
  await driver.put("books/dracula/cover.jpg", Buffer.from("cover bytes"), "image/jpeg");
  await driver.put(
    "books/dracula/content/OEBPS/content.opf",
    Buffer.from("<opf/>"),
    "application/oebps-package+xml"
  );
});

describe("createBackupStream", () => {
  it("includes everything when includeFiles is true", async () => {
    const zip = await collect(createBackupStream({ includeFiles: true }));
    const files = unzipSync(zip);
    expect(Object.keys(files).sort()).toEqual(
      [
        "index.json",
        "settings.json",
        "books/dracula/metadata.json",
        "books/dracula/book.epub",
        "books/dracula/cover.jpg",
        "books/dracula/content/OEBPS/content.opf",
      ].sort()
    );
  });

  it("excludes book binaries (epub/cover/content) but keeps metadata.json when includeFiles is false", async () => {
    const zip = await collect(createBackupStream({ includeFiles: false }));
    const files = unzipSync(zip);
    expect(Object.keys(files).sort()).toEqual(
      ["index.json", "settings.json", "books/dracula/metadata.json"].sort()
    );
  });

  it("preserves file bytes exactly", async () => {
    const zip = await collect(createBackupStream({ includeFiles: true }));
    const files = unzipSync(zip);
    expect(Buffer.from(files["books/dracula/book.epub"]).toString()).toBe("epub bytes");
  });
});
