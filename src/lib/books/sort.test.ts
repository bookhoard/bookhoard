import { describe, expect, it } from "vitest";
import { sortBooks } from "./sort";
import type { Book } from "./types";

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

describe("sortBooks", () => {
  it("does not mutate the input array", () => {
    const books = [book({ id: "a", addedAt: "2024-01-01" }), book({ id: "b", addedAt: "2024-02-01" })];
    const original = [...books];
    sortBooks(books, "recent");
    expect(books).toEqual(original);
  });

  it("sorts by recent (addedAt) descending", () => {
    const a = book({ id: "a", addedAt: "2024-01-01" });
    const b = book({ id: "b", addedAt: "2024-03-01" });
    const c = book({ id: "c", addedAt: "2024-02-01" });
    expect(sortBooks([a, b, c], "recent").map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by recently-read, treating missing lastReadAt as never read", () => {
    const a = book({ id: "a", lastReadAt: "2024-01-01" });
    const b = book({ id: "b" }); // never read
    const c = book({ id: "c", lastReadAt: "2024-02-01" });
    expect(sortBooks([a, b, c], "recently-read").map((x) => x.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by title alphabetically", () => {
    const a = book({ id: "a", title: "Zebra" });
    const b = book({ id: "b", title: "Apple" });
    expect(sortBooks([a, b], "title").map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("sorts by author, then title as a tiebreaker", () => {
    const a = book({ id: "a", author: "Smith", title: "Beta" });
    const b = book({ id: "b", author: "Smith", title: "Alpha" });
    const c = book({ id: "c", author: "Adams", title: "Zeta" });
    expect(sortBooks([a, b, c], "author").map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  it("sorts by rating descending, treating missing rating as 0, then title", () => {
    const a = book({ id: "a", rating: 3, title: "B" });
    const b = book({ id: "b", title: "A" }); // unrated
    const c = book({ id: "c", rating: 5, title: "C" });
    expect(sortBooks([a, b, c], "rating").map((x) => x.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts read-first, then title as a tiebreaker", () => {
    const a = book({ id: "a", read: false, title: "B" });
    const b = book({ id: "b", read: true, title: "Z" });
    const c = book({ id: "c", read: true, title: "A" });
    expect(sortBooks([a, b, c], "read").map((x) => x.id)).toEqual(["c", "b", "a"]);
  });
});
