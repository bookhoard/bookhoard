import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchOpenLibraryDescription, lookupOpenLibraryCandidates } from "./openlibrary";

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

function routeFetch(routes: Record<string, unknown>) {
  fetchMock.mockImplementation(async (url: string) => {
    for (const [pattern, body] of Object.entries(routes)) {
      if (url.includes(pattern)) return jsonResponse(body);
    }
    return jsonResponse(null, false);
  });
}

describe("lookupOpenLibraryCandidates", () => {
  it("adds an ISBN-matched candidate first when an ISBN is given", async () => {
    routeFetch({
      "/isbn/9780486411095.json": {
        title: "Dracula",
        description: "A vampire novel.",
        covers: [111],
      },
      "/search.json?title=": { docs: [] },
    });

    const [first] = await lookupOpenLibraryCandidates({
      isbn: "9780486411095",
      title: "Dracula",
      author: "Bram Stoker",
    });

    expect(first).toEqual({
      title: "Dracula",
      description: "A vampire novel.",
      coverUrl: "https://covers.openlibrary.org/b/id/111-L.jpg",
    });
  });

  it("finds a work, lists one edition per language, sorted English-first", async () => {
    routeFetch({
      "/search.json?title=": { docs: [{ key: "/works/OL1W", title: "Dracula", author_name: ["Bram Stoker"] }] },
      "/works/OL1W/editions.json": {
        entries: [
          {
            title: "Dracula (French)",
            languages: [{ key: "/languages/fre" }],
            covers: [222],
            works: [{ key: "/works/OL1W" }],
          },
          {
            title: "Dracula",
            languages: [{ key: "/languages/eng" }],
            covers: [333],
            works: [{ key: "/works/OL1W" }],
          },
        ],
      },
      "/works/OL1W.json": { description: "The work description.", covers: [999] },
    });

    const candidates = await lookupOpenLibraryCandidates({ title: "Dracula", author: "Bram Stoker" });

    expect(candidates).toHaveLength(2);
    expect(candidates[0].language).toBe("eng");
    expect(candidates[0].coverUrl).toBe("https://covers.openlibrary.org/b/id/333-L.jpg");
    expect(candidates[1].language).toBe("fre");
  });

  it("falls back to the work's cover when an edition has none", async () => {
    routeFetch({
      "/search.json?title=": { docs: [{ key: "/works/OL1W", title: "Dracula", author_name: ["Bram Stoker"] }] },
      "/works/OL1W/editions.json": {
        entries: [{ title: "Dracula", languages: [{ key: "/languages/eng" }], works: [{ key: "/works/OL1W" }] }],
      },
      "/works/OL1W.json": { covers: [999] },
    });

    const [candidate] = await lookupOpenLibraryCandidates({ title: "Dracula", author: "Bram Stoker" });
    expect(candidate.coverUrl).toBe("https://covers.openlibrary.org/b/id/999-L.jpg");
  });

  it("falls back to a loose full-text search when no work matches", async () => {
    routeFetch({
      "/search.json?title=": { docs: [] },
      "/search.json?q=": {
        docs: [{ key: "/works/OL9W", title: "Some Book", author_name: ["Someone"], cover_i: 5, language: ["eng"] }],
      },
    });

    const candidates = await lookupOpenLibraryCandidates({ title: "Some Book", author: "Someone" });
    expect(candidates).toEqual([
      {
        key: "/works/OL9W",
        title: "Some Book",
        authors: ["Someone"],
        language: "eng",
        coverUrl: "https://covers.openlibrary.org/b/id/5-L.jpg",
      },
    ]);
  });

  it("caps the number of candidates at the given limit", async () => {
    routeFetch({
      "/search.json?title=": { docs: [{ key: "/works/OL1W", title: "Dracula", author_name: ["Bram Stoker"] }] },
      "/works/OL1W/editions.json": {
        entries: Array.from({ length: 5 }, (_, i) => ({
          title: `Dracula ${i}`,
          languages: [{ key: `/languages/l${i}` }],
          works: [{ key: "/works/OL1W" }],
        })),
      },
      "/works/OL1W.json": {},
    });

    const candidates = await lookupOpenLibraryCandidates({ title: "Dracula", author: "Bram Stoker" }, 2);
    expect(candidates).toHaveLength(2);
  });
});

describe("fetchOpenLibraryDescription", () => {
  it("extracts a plain string description", async () => {
    routeFetch({ "/works/OL1W.json": { description: "Plain text." } });
    expect(await fetchOpenLibraryDescription("/works/OL1W")).toBe("Plain text.");
  });

  it("extracts the value from an { value } description object", async () => {
    routeFetch({ "/works/OL1W.json": { description: { value: "Rich text." } } });
    expect(await fetchOpenLibraryDescription("/works/OL1W")).toBe("Rich text.");
  });

  it("returns undefined when the lookup fails", async () => {
    routeFetch({});
    expect(await fetchOpenLibraryDescription("/works/OL1W")).toBeUndefined();
  });
});
