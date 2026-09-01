import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDriver } from "@/lib/storage/test-helpers";

const driver = createMemoryDriver();
vi.mock("@/lib/storage", () => ({
  getStorage: () => driver,
}));

const { listShelves, createShelf, updateShelf, deleteShelf, addBookToShelf, removeBookFromShelf } =
  await import("./store");

beforeEach(() => {
  driver.files.clear();
});

describe("listShelves", () => {
  it("seeds default shelves on first access for a profile", async () => {
    const shelves = await listShelves("p1");
    expect(shelves.map((s) => s.name)).toEqual([
      "Fiction",
      "Non-Fiction",
      "Sci-Fi & Fantasy",
      "Biography",
      "To Read",
    ]);
    expect(shelves.every((s) => s.bookIds.length === 0)).toBe(true);
  });

  it("is idempotent — a second call doesn't reseed or duplicate", async () => {
    await listShelves("p1");
    const shelves = await listShelves("p1");
    expect(shelves).toHaveLength(5);
  });

  it("scopes shelves per profile", async () => {
    await createShelf("p1", "Custom");
    const p2Shelves = await listShelves("p2");
    expect(p2Shelves.some((s) => s.name === "Custom")).toBe(false);
  });
});

describe("createShelf", () => {
  it("trims the name and defaults to 'New Shelf' when blank", async () => {
    await listShelves("p1");
    const shelf = await createShelf("p1", "   ");
    expect(shelf.name).toBe("New Shelf");
  });

  it("appends to the existing list without touching other shelves", async () => {
    await listShelves("p1");
    const shelf = await createShelf("p1", "Poetry");
    const all = await listShelves("p1");
    expect(all).toHaveLength(6);
    expect(all[all.length - 1].id).toBe(shelf.id);
  });
});

describe("updateShelf / deleteShelf", () => {
  it("updateShelf patches name/color and leaves bookIds untouched", async () => {
    await listShelves("p1");
    const shelf = await createShelf("p1", "Poetry");
    await addBookToShelf("p1", shelf.id, "book-1");
    const updated = await updateShelf("p1", shelf.id, { name: "Renamed" });
    expect(updated).toMatchObject({ name: "Renamed", bookIds: ["book-1"] });
  });

  it("updateShelf returns null for an unknown id", async () => {
    await listShelves("p1");
    expect(await updateShelf("p1", "missing", { name: "X" })).toBeNull();
  });

  it("deleteShelf removes just that shelf", async () => {
    await listShelves("p1");
    const shelf = await createShelf("p1", "Poetry");
    await deleteShelf("p1", shelf.id);
    const all = await listShelves("p1");
    expect(all.some((s) => s.id === shelf.id)).toBe(false);
    expect(all).toHaveLength(5);
  });
});

describe("addBookToShelf / removeBookFromShelf", () => {
  it("addBookToShelf is idempotent — adding the same book twice doesn't duplicate it", async () => {
    await listShelves("p1");
    const shelf = await createShelf("p1", "Poetry");
    await addBookToShelf("p1", shelf.id, "book-1");
    const shelves = await addBookToShelf("p1", shelf.id, "book-1");
    expect(shelves.find((s) => s.id === shelf.id)?.bookIds).toEqual(["book-1"]);
  });

  it("removeBookFromShelf removes only the given book", async () => {
    await listShelves("p1");
    const shelf = await createShelf("p1", "Poetry");
    await addBookToShelf("p1", shelf.id, "book-1");
    await addBookToShelf("p1", shelf.id, "book-2");
    const shelves = await removeBookFromShelf("p1", shelf.id, "book-1");
    expect(shelves.find((s) => s.id === shelf.id)?.bookIds).toEqual(["book-2"]);
  });

  it("removeBookFromShelf on a book that isn't on the shelf is a no-op", async () => {
    await listShelves("p1");
    const shelf = await createShelf("p1", "Poetry");
    const shelves = await removeBookFromShelf("p1", shelf.id, "not-there");
    expect(shelves.find((s) => s.id === shelf.id)?.bookIds).toEqual([]);
  });
});
