import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchTrendingBooks } from "./trending";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("fetchTrendingBooks", () => {
  it("maps Open Library works into TrendingBook entries", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        works: [{ key: "/works/OL1W", title: "Dracula", author_name: ["Bram Stoker"], cover_i: 123 }],
      })
    );
    const books = await fetchTrendingBooks("weekly");
    expect(books).toEqual([
      {
        key: "/works/OL1W",
        title: "Dracula",
        authors: ["Bram Stoker"],
        coverUrl: "https://covers.openlibrary.org/b/id/123-M.jpg",
      },
    ]);
  });

  it("omits coverUrl when the work has no cover_i", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ works: [{ key: "/works/OL1W", title: "Dracula" }] }));
    const [book] = await fetchTrendingBooks();
    expect(book.coverUrl).toBeUndefined();
  });

  it("drops works missing a key or title", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ works: [{ title: "No key" }, { key: "/works/OL2W" }, { key: "/works/OL3W", title: "OK" }] })
    );
    const books = await fetchTrendingBooks();
    expect(books).toEqual([{ key: "/works/OL3W", title: "OK", authors: undefined, coverUrl: undefined }]);
  });

  it("respects the limit parameter", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        works: Array.from({ length: 30 }, (_, i) => ({ key: `/works/OL${i}W`, title: `Book ${i}` })),
      })
    );
    const books = await fetchTrendingBooks("weekly", 5);
    expect(books).toHaveLength(5);
  });

  it("returns an empty array when the response is not ok", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false));
    expect(await fetchTrendingBooks()).toEqual([]);
  });

  it("returns an empty array instead of throwing on a network error", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    expect(await fetchTrendingBooks()).toEqual([]);
  });
});
