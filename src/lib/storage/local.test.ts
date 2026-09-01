import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalDriver } from "./local";

let root: string;
let driver: LocalDriver;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "bookhoarder-local-"));
  driver = new LocalDriver(root);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function readAll(stream: Awaited<ReturnType<LocalDriver["get"]>>): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

describe("LocalDriver", () => {
  it("round-trips a buffer through put/get", async () => {
    await driver.put("books/a/book.epub", Buffer.from("epub bytes"), "application/epub+zip");
    expect(await readAll(await driver.get("books/a/book.epub"))).toBe("epub bytes");
  });

  it("creates nested directories as needed", async () => {
    await driver.put("a/b/c/file.txt", Buffer.from("nested"), "text/plain");
    expect(await readAll(await driver.get("a/b/c/file.txt"))).toBe("nested");
  });

  it("does not leave a .tmp file behind after a successful write", async () => {
    await driver.put("file.txt", Buffer.from("x"), "text/plain");
    const entries = await readdir(root);
    expect(entries.some((e) => e.endsWith(".tmp"))).toBe(false);
  });

  it("exists() reflects whether a key has been written", async () => {
    expect(await driver.exists("file.txt")).toBe(false);
    await driver.put("file.txt", Buffer.from("x"), "text/plain");
    expect(await driver.exists("file.txt")).toBe(true);
  });

  it("delete() removes a key and is a no-op if it's already gone", async () => {
    await driver.put("file.txt", Buffer.from("x"), "text/plain");
    await driver.delete("file.txt");
    expect(await driver.exists("file.txt")).toBe(false);
    await expect(driver.delete("file.txt")).resolves.not.toThrow();
  });

  it("list() returns every key under a prefix, using forward slashes", async () => {
    await driver.put("books/a/book.epub", Buffer.from("x"), "application/epub+zip");
    await driver.put("books/a/cover.jpg", Buffer.from("x"), "image/jpeg");
    await driver.put("books/b/book.epub", Buffer.from("x"), "application/epub+zip");
    await driver.put("settings.json", Buffer.from("{}"), "application/json");

    const keys = (await driver.list("books")).sort();
    expect(keys).toEqual(["books/a/book.epub", "books/a/cover.jpg", "books/b/book.epub"]);
  });

  it("list() excludes in-progress .tmp files", async () => {
    await driver.put("books/a/book.epub", Buffer.from("x"), "application/epub+zip");
    const keys = await driver.list("");
    expect(keys.every((k) => !k.endsWith(".tmp"))).toBe(true);
  });

  it("list() returns an empty array for a prefix that doesn't exist", async () => {
    expect(await driver.list("nothing-here")).toEqual([]);
  });

  it("a later put() for the same key overwrites the earlier content", async () => {
    await driver.put("file.txt", Buffer.from("first"), "text/plain");
    await driver.put("file.txt", Buffer.from("second"), "text/plain");
    expect(await readAll(await driver.get("file.txt"))).toBe("second");
  });

  it("signedUrl always returns null (no signing support)", async () => {
    expect(await driver.signedUrl("file.txt", 3600)).toBeNull();
  });
});
