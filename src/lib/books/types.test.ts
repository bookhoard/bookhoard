import { describe, expect, it } from "vitest";
import { bookCoverUrl, bookFileUrl, bookOpfUrl, toLibraryBook, type BookRecord } from "./types";

function record(overrides: Partial<BookRecord> & Pick<BookRecord, "id">): BookRecord {
  return {
    contentHash: "hash",
    title: "Title",
    author: "Author",
    size: 0,
    addedAt: "2024-01-01T00:00:00.000Z",
    hasCover: false,
    ...overrides,
  };
}

describe("bookCoverUrl", () => {
  it("returns null when the book has no cover", () => {
    expect(bookCoverUrl(record({ id: "a", hasCover: false }))).toBeNull();
  });

  it("returns null when hasCover is true but coverExt is missing", () => {
    expect(bookCoverUrl(record({ id: "a", hasCover: true }))).toBeNull();
  });

  it("builds a cache-busting URL when coverUpdatedAt is set", () => {
    const url = bookCoverUrl(
      record({ id: "a", hasCover: true, coverExt: "jpg", coverUpdatedAt: "2024-01-02T00:00:00.000Z" })
    );
    expect(url).toBe("/api/files/books/a/cover.jpg?v=2024-01-02T00%3A00%3A00.000Z");
  });

  it("builds a plain URL when coverUpdatedAt is missing", () => {
    const url = bookCoverUrl(record({ id: "a", hasCover: true, coverExt: "png" }));
    expect(url).toBe("/api/files/books/a/cover.png");
  });
});

describe("bookFileUrl / bookOpfUrl", () => {
  it("builds the raw epub URL", () => {
    expect(bookFileUrl("dracula")).toBe("/api/files/books/dracula/book.epub");
  });

  it("builds the extracted OPF URL", () => {
    expect(bookOpfUrl("dracula", "OEBPS/content.opf")).toBe(
      "/api/files/books/dracula/content/OEBPS/content.opf"
    );
  });
});

describe("toLibraryBook", () => {
  it("resolves coverUrl and leaves reading state unset for a new upload", () => {
    const book = toLibraryBook(record({ id: "a", hasCover: true, coverExt: "jpg" }));
    expect(book.coverUrl).toBe("/api/files/books/a/cover.jpg");
    expect(book.rating).toBeUndefined();
    expect(book.read).toBeUndefined();
  });
});
