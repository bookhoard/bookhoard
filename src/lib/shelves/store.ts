import { mutateJson, readJson } from "@/lib/store";
import { nextShelfColor, type Shelf } from "@/lib/shelves";

function keyFor(profileId: string): string {
  return `shelves/${profileId}.json`;
}

/** Seeded once per profile on first access so the sidebar isn't empty. */
const DEFAULT_SHELF_NAMES = ["Fiction", "Non-Fiction", "Sci-Fi & Fantasy", "Biography", "To Read"];

function defaultShelves(): Shelf[] {
  return DEFAULT_SHELF_NAMES.map((name, i) => ({
    id: crypto.randomUUID(),
    name,
    color: nextShelfColor(i),
    bookIds: [],
  }));
}

export async function listShelves(profileId: string): Promise<Shelf[]> {
  const existing = await readJson<Shelf[]>(keyFor(profileId));
  if (existing) return existing;
  return mutateJson<Shelf[]>(keyFor(profileId), (current) => current ?? defaultShelves());
}

export async function createShelf(profileId: string, name: string, color?: string): Promise<Shelf> {
  const trimmed = name.trim() || "New Shelf";
  const shelves = await mutateJson<Shelf[]>(keyFor(profileId), (current) => {
    const list = current ?? [];
    const shelf: Shelf = {
      id: crypto.randomUUID(),
      name: trimmed,
      color: color ?? nextShelfColor(list.length),
      bookIds: [],
    };
    return [...list, shelf];
  });
  return shelves[shelves.length - 1];
}

export async function updateShelf(
  profileId: string,
  id: string,
  patch: Partial<Pick<Shelf, "name" | "color">>
): Promise<Shelf | null> {
  const shelves = await mutateJson<Shelf[]>(keyFor(profileId), (current) =>
    (current ?? []).map((shelf) => (shelf.id === id ? { ...shelf, ...patch } : shelf))
  );
  return shelves.find((shelf) => shelf.id === id) ?? null;
}

export async function deleteShelf(profileId: string, id: string): Promise<void> {
  await mutateJson<Shelf[]>(keyFor(profileId), (current) =>
    (current ?? []).filter((shelf) => shelf.id !== id)
  );
}

/** Idempotent — dropping the same book on a shelf twice doesn't duplicate it. */
export async function addBookToShelf(
  profileId: string,
  shelfId: string,
  bookId: string
): Promise<Shelf[]> {
  return mutateJson<Shelf[]>(keyFor(profileId), (current) =>
    (current ?? []).map((shelf) =>
      shelf.id === shelfId && !shelf.bookIds.includes(bookId)
        ? { ...shelf, bookIds: [...shelf.bookIds, bookId] }
        : shelf
    )
  );
}

export async function removeBookFromShelf(
  profileId: string,
  shelfId: string,
  bookId: string
): Promise<Shelf[]> {
  return mutateJson<Shelf[]>(keyFor(profileId), (current) =>
    (current ?? []).map((shelf) =>
      shelf.id === shelfId
        ? { ...shelf, bookIds: shelf.bookIds.filter((id) => id !== bookId) }
        : shelf
    )
  );
}
