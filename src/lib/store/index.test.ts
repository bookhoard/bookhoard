import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDriver } from "@/lib/storage/test-helpers";

const driver = createMemoryDriver();
vi.mock("@/lib/storage", () => ({
  getStorage: () => driver,
}));

// Imported after the mock so `getStorage` resolves to our in-memory driver.
const { readJson, mutateJson, mutateJsonDebounced, flushPendingWrites } = await import("./index");

beforeEach(() => {
  driver.files.clear();
});

describe("readJson / mutateJson", () => {
  it("returns null for a key that doesn't exist", async () => {
    expect(await readJson("missing.json")).toBeNull();
  });

  it("round-trips a written value", async () => {
    await mutateJson("a.json", () => ({ count: 1 }));
    expect(await readJson("a.json")).toEqual({ count: 1 });
  });

  it("passes the current value (or null) into the mutator", async () => {
    await mutateJson<{ count: number }>("a.json", (current) => ({ count: (current?.count ?? 0) + 1 }));
    await mutateJson<{ count: number }>("a.json", (current) => ({ count: (current?.count ?? 0) + 1 }));
    expect(await readJson("a.json")).toEqual({ count: 2 });
  });

  it("serializes concurrent mutations on the same key instead of dropping one", async () => {
    await mutateJson<{ count: number }>("counter.json", () => ({ count: 0 }));
    await Promise.all(
      Array.from({ length: 20 }, () =>
        mutateJson<{ count: number }>("counter.json", (current) => ({
          count: (current?.count ?? 0) + 1,
        }))
      )
    );
    expect(await readJson("counter.json")).toEqual({ count: 20 });
  });

  it("keeps a later key's queue independent of an earlier key's failure", async () => {
    await expect(
      mutateJson("bad.json", () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    // the queue for "bad.json" must still accept new writes after a rejection
    await mutateJson("bad.json", () => ({ ok: true }));
    expect(await readJson("bad.json")).toEqual({ ok: true });
  });
});

describe("mutateJsonDebounced / flushPendingWrites", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("coalesces multiple calls within the debounce window into one write", async () => {
    mutateJsonDebounced<{ count: number }>("progress.json", (current) => ({
      count: (current?.count ?? 0) + 1,
    }));
    mutateJsonDebounced<{ count: number }>("progress.json", (current) => ({
      count: (current?.count ?? 0) + 1,
    }));
    mutateJsonDebounced<{ count: number }>("progress.json", (current) => ({
      count: (current?.count ?? 0) + 1,
    }));

    await vi.advanceTimersByTimeAsync(10_000);
    // only the last mutator should have run, against the real (still-empty) state
    expect(await readJson("progress.json")).toEqual({ count: 1 });
  });

  it("flushPendingWrites runs pending debounced writes immediately", async () => {
    mutateJsonDebounced("flush-me.json", () => ({ flushed: true }));
    await flushPendingWrites();
    expect(await readJson("flush-me.json")).toEqual({ flushed: true });
  });
});
