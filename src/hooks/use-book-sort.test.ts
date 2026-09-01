// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useBookSort } from "./use-book-sort";

/**
 * jsdom's own localStorage getter doesn't come through in this Node/jsdom
 * combo (Node's experimental native `localStorage` global shadows it), so
 * we install a minimal in-memory Storage-shaped stand-in directly.
 */
class FakeStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  clear(): void {
    this.data.clear();
  }
}

class ThrowingStorage {
  getItem(): never {
    throw new Error("private browsing");
  }
  setItem(): never {
    throw new Error("private browsing");
  }
  removeItem(): never {
    throw new Error("private browsing");
  }
  clear(): never {
    throw new Error("private browsing");
  }
}

let storage: FakeStorage | ThrowingStorage;

function installStorage(next: FakeStorage | ThrowingStorage) {
  storage = next;
  Object.defineProperty(globalThis, "localStorage", {
    value: next,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  installStorage(new FakeStorage());
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "localStorage");
});

describe("useBookSort", () => {
  it("starts at the given default when nothing is stored", () => {
    const { result } = renderHook(() => useBookSort("sort-key", "recent"));
    expect(result.current[0]).toBe("recent");
  });

  it("picks up a previously stored sort on mount", () => {
    storage.setItem("sort-key", "title");
    const { result } = renderHook(() => useBookSort("sort-key", "recent"));
    expect(result.current[0]).toBe("title");
  });

  it("updates state and persists the new sort to localStorage", () => {
    const { result } = renderHook(() => useBookSort("sort-key", "recent"));
    act(() => result.current[1]("author"));
    expect(result.current[0]).toBe("author");
    expect(storage.getItem("sort-key")).toBe("author");
  });

  it("keeps working (state still updates) when localStorage throws", () => {
    installStorage(new ThrowingStorage());

    const { result } = renderHook(() => useBookSort("sort-key", "recent"));
    expect(result.current[0]).toBe("recent");
    act(() => result.current[1]("rating"));
    expect(result.current[0]).toBe("rating");
  });

  it("scopes storage per storageKey", () => {
    storage.setItem("grid-a", "title");
    storage.setItem("grid-b", "rating");
    const a = renderHook(() => useBookSort("grid-a", "recent"));
    const b = renderHook(() => useBookSort("grid-b", "recent"));
    expect(a.result.current[0]).toBe("title");
    expect(b.result.current[0]).toBe("rating");
  });
});
