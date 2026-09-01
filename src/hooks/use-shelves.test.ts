// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Shelf } from "@/lib/shelves";

const toastAdd = vi.fn();
vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

const { useShelves } = await import("./use-shelves");

const fetchMock = vi.fn();

function shelf(overrides: Partial<Shelf> & Pick<Shelf, "id">): Shelf {
  return { name: "Shelf", color: "bg-blue-500", bookIds: [], ...overrides };
}

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  toastAdd.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useShelves — initial load", () => {
  it("loads shelves from the server on mount", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ shelves: [shelf({ id: "a" })] }));
    const { result } = renderHook(() => useShelves("p1"));

    expect(result.current.loaded).toBe(false);
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.shelves).toEqual([shelf({ id: "a" })]);
  });

  it("falls back to an empty list when the fetch fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false));
    const { result } = renderHook(() => useShelves("p1"));
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.shelves).toEqual([]);
  });
});

describe("useShelves — createShelf", () => {
  it("appends the server-created shelf on success", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ shelves: [] }));
    const { result } = renderHook(() => useShelves("p1"));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    fetchMock.mockResolvedValueOnce(jsonResponse({ shelf: shelf({ id: "new" }) }));
    act(() => result.current.createShelf("Poetry"));
    await waitFor(() => expect(result.current.shelves).toHaveLength(1));
    expect(result.current.shelves[0].id).toBe("new");
  });

  it("ignores a blank name without calling fetch", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ shelves: [] }));
    const { result } = renderHook(() => useShelves("p1"));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    fetchMock.mockClear();
    act(() => result.current.createShelf("   "));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a toast and resyncs from the server on failure", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ shelves: [shelf({ id: "existing" })] }));
    const { result } = renderHook(() => useShelves("p1"));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Blocked in demo mode" }, false));
    fetchMock.mockResolvedValueOnce(jsonResponse({ shelves: [shelf({ id: "existing" })] }));
    act(() => result.current.createShelf("Poetry"));

    await waitFor(() => expect(toastAdd).toHaveBeenCalledWith({ title: "Blocked in demo mode", type: "error" }));
    expect(result.current.shelves).toEqual([shelf({ id: "existing" })]);
  });
});

describe("useShelves — deleteShelf", () => {
  it("removes the shelf optimistically before the request resolves", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ shelves: [shelf({ id: "a" }), shelf({ id: "b" })] }));
    const { result } = renderHook(() => useShelves("p1"));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    act(() => result.current.deleteShelf("a"));
    expect(result.current.shelves.map((s) => s.id)).toEqual(["b"]);
  });

  it("rolls back via resync when the delete fails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ shelves: [shelf({ id: "a" })] }));
    const { result } = renderHook(() => useShelves("p1"));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Nope" }, false));
    fetchMock.mockResolvedValueOnce(jsonResponse({ shelves: [shelf({ id: "a" })] }));
    act(() => result.current.deleteShelf("a"));

    await waitFor(() => expect(result.current.shelves).toEqual([shelf({ id: "a" })]));
  });
});

describe("useShelves — toggleBookInShelf / addBookToShelf", () => {
  it("adds the book when it isn't already on the shelf", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ shelves: [shelf({ id: "a", bookIds: [] })] }));
    const { result } = renderHook(() => useShelves("p1"));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    act(() => result.current.toggleBookInShelf("a", "book-1"));
    expect(result.current.shelves[0].bookIds).toEqual(["book-1"]);
  });

  it("removes the book when it's already on the shelf", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ shelves: [shelf({ id: "a", bookIds: ["book-1"] })] }));
    const { result } = renderHook(() => useShelves("p1"));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    act(() => result.current.toggleBookInShelf("a", "book-1"));
    expect(result.current.shelves[0].bookIds).toEqual([]);
  });

  it("addBookToShelf is idempotent — adding twice doesn't duplicate", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ shelves: [shelf({ id: "a", bookIds: ["book-1"] })] }));
    const { result } = renderHook(() => useShelves("p1"));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    fetchMock.mockResolvedValue(jsonResponse({}));
    act(() => result.current.addBookToShelf("a", "book-1"));
    expect(result.current.shelves[0].bookIds).toEqual(["book-1"]);
  });
});
