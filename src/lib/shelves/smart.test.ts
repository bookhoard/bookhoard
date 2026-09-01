import { describe, expect, it } from "vitest";
import { computeSmartShelves } from "./smart";
import type { Book } from "@/lib/books/types";

function book(overrides: Partial<Book> & Pick<Book, "id">): Book {
  return {
    contentHash: "hash",
    title: "Title",
    author: "Author",
    size: 0,
    addedAt: "2024-01-01T00:00:00.000Z",
    hasCover: false,
    coverUrl: null,
    ...overrides,
  };
}

function idsOf(shelves: ReturnType<typeof computeSmartShelves>, id: string): string[] {
  return shelves.find((s) => s.id === id)!.bookIds;
}

describe("computeSmartShelves", () => {
  it("puts a book with no progress and not read into unread", () => {
    const b = book({ id: "a", read: false, progress: undefined });
    const shelves = computeSmartShelves([b]);
    expect(idsOf(shelves, "unread")).toEqual(["a"]);
    expect(idsOf(shelves, "currently-reading")).toEqual([]);
  });

  it("puts a book with progress defined (even 0) into currently-reading, not unread", () => {
    const b = book({ id: "a", read: false, progress: 0 });
    const shelves = computeSmartShelves([b]);
    expect(idsOf(shelves, "currently-reading")).toEqual(["a"]);
    expect(idsOf(shelves, "unread")).toEqual([]);
  });

  it("puts a finished book into finished regardless of progress", () => {
    const b = book({ id: "a", read: true, progress: 50 });
    const shelves = computeSmartShelves([b]);
    expect(idsOf(shelves, "finished")).toEqual(["a"]);
    expect(idsOf(shelves, "currently-reading")).toEqual([]);
    expect(idsOf(shelves, "unread")).toEqual([]);
  });

  it("only includes rating exactly 5 in the 5-star shelf", () => {
    const four = book({ id: "a", rating: 4 });
    const five = book({ id: "b", rating: 5 });
    const unrated = book({ id: "c" });
    const shelves = computeSmartShelves([four, five, unrated]);
    expect(idsOf(shelves, "5-star")).toEqual(["b"]);
  });

  it("returns empty bookIds arrays for an empty library", () => {
    const shelves = computeSmartShelves([]);
    for (const shelf of shelves) {
      expect(shelf.bookIds).toEqual([]);
    }
  });
});
