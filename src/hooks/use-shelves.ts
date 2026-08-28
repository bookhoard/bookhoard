"use client";

import * as React from "react";
import { type Shelf, nextShelfColor } from "@/lib/shelves";

function storageKey(profileId: string): string {
  return `bookhoard:shelves:${profileId}`;
}

function loadShelves(profileId: string): Shelf[] {
  try {
    const raw = window.localStorage.getItem(storageKey(profileId));
    return raw ? (JSON.parse(raw) as Shelf[]) : [];
  } catch {
    return [];
  }
}

/**
 * Client-side prototype: shelves live in localStorage, namespaced per
 * profile, until the bucket-backed collections sidecar lands in a later
 * phase.
 */
export function useShelves(profileId: string) {
  const [shelves, setShelves] = React.useState<Shelf[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setShelves(loadShelves(profileId));
    setLoaded(true);
  }, [profileId]);

  React.useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey(profileId), JSON.stringify(shelves));
    } catch {
      // private browsing / quota — shelves just won't persist
    }
  }, [shelves, loaded, profileId]);

  const createShelf = React.useCallback((name: string, color?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setShelves((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        color: color ?? nextShelfColor(prev.length),
        bookIds: [],
      },
    ]);
  }, []);

  const deleteShelf = React.useCallback((id: string) => {
    setShelves((prev) => prev.filter((shelf) => shelf.id !== id));
  }, []);

  const renameShelf = React.useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setShelves((prev) =>
      prev.map((shelf) => (shelf.id === id ? { ...shelf, name: trimmed } : shelf))
    );
  }, []);

  const recolorShelf = React.useCallback((id: string, color: string) => {
    setShelves((prev) =>
      prev.map((shelf) => (shelf.id === id ? { ...shelf, color } : shelf))
    );
  }, []);

  const toggleBookInShelf = React.useCallback((shelfId: string, bookId: string) => {
    setShelves((prev) =>
      prev.map((shelf) =>
        shelf.id === shelfId
          ? {
              ...shelf,
              bookIds: shelf.bookIds.includes(bookId)
                ? shelf.bookIds.filter((id) => id !== bookId)
                : [...shelf.bookIds, bookId],
            }
          : shelf
      )
    );
  }, []);

  // Idempotent add (unlike toggle) — the right semantics for a drag-and-drop
  // gesture, where dropping the same book on a shelf twice shouldn't remove it.
  const addBookToShelf = React.useCallback((shelfId: string, bookId: string) => {
    setShelves((prev) =>
      prev.map((shelf) =>
        shelf.id === shelfId && !shelf.bookIds.includes(bookId)
          ? { ...shelf, bookIds: [...shelf.bookIds, bookId] }
          : shelf
      )
    );
  }, []);

  return {
    shelves,
    createShelf,
    deleteShelf,
    renameShelf,
    recolorShelf,
    toggleBookInShelf,
    addBookToShelf,
  };
}
