import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDriver } from "@/lib/storage/test-helpers";
import type { BookRecord } from "@/lib/books/types";

const driver = createMemoryDriver();
vi.mock("@/lib/storage", () => ({
  getStorage: () => driver,
}));

const { getProfileState, setProfileState, updateProfileBookState, deleteProfileBookState, applyProfileState } =
  await import("./state");

beforeEach(() => {
  driver.files.clear();
});

describe("getProfileState / setProfileState", () => {
  it("returns an empty object when no state has been written yet", async () => {
    expect(await getProfileState("p1")).toEqual({});
  });

  it("round-trips a full state object, scoped per profile", async () => {
    await setProfileState("p1", { "book-1": { rating: 4 } });
    await setProfileState("p2", { "book-1": { rating: 2 } });
    expect(await getProfileState("p1")).toEqual({ "book-1": { rating: 4 } });
    expect(await getProfileState("p2")).toEqual({ "book-1": { rating: 2 } });
  });
});

describe("updateProfileBookState", () => {
  it("creates a new entry when the book has no prior state", async () => {
    const state = await updateProfileBookState("p1", "book-1", { rating: 5 });
    expect(state).toEqual({ rating: 5 });
  });

  it("merges the patch into existing state instead of replacing it", async () => {
    await updateProfileBookState("p1", "book-1", { rating: 5 });
    const state = await updateProfileBookState("p1", "book-1", { read: true });
    expect(state).toEqual({ rating: 5, read: true });
  });

  it("does not affect other books' state", async () => {
    await updateProfileBookState("p1", "book-1", { rating: 5 });
    await updateProfileBookState("p1", "book-2", { rating: 1 });
    expect(await getProfileState("p1")).toEqual({
      "book-1": { rating: 5 },
      "book-2": { rating: 1 },
    });
  });
});

describe("deleteProfileBookState", () => {
  it("removes just the given book's state", async () => {
    await updateProfileBookState("p1", "book-1", { rating: 5 });
    await updateProfileBookState("p1", "book-2", { rating: 1 });
    await deleteProfileBookState("p1", "book-1");
    expect(await getProfileState("p1")).toEqual({ "book-2": { rating: 1 } });
  });

  it("is a no-op when there's no state yet at all", async () => {
    await expect(deleteProfileBookState("p1", "book-1")).resolves.not.toThrow();
    expect(await getProfileState("p1")).toEqual({});
  });

  it("is a no-op when the given book has no state", async () => {
    await updateProfileBookState("p1", "book-2", { rating: 1 });
    await deleteProfileBookState("p1", "book-1");
    expect(await getProfileState("p1")).toEqual({ "book-2": { rating: 1 } });
  });
});

describe("applyProfileState", () => {
  const record: BookRecord = {
    id: "book-1",
    contentHash: "hash",
    title: "Title",
    author: "Author",
    size: 0,
    addedAt: "2024-01-01T00:00:00.000Z",
    hasCover: true,
    coverExt: "jpg",
  };

  it("defaults read to false and other fields to undefined when there's no state", () => {
    const book = applyProfileState(record);
    expect(book.read).toBe(false);
    expect(book.rating).toBeUndefined();
    expect(book.progress).toBeUndefined();
    expect(book.coverUrl).toBe("/api/files/books/book-1/cover.jpg");
  });

  it("layers the profile's reading state onto the shared record", () => {
    const book = applyProfileState(record, { rating: 4, read: true, progress: 42, cfi: "epubcfi(...)" });
    expect(book).toMatchObject({ rating: 4, read: true, progress: 42, cfi: "epubcfi(...)" });
    expect(book.id).toBe("book-1");
  });
});
