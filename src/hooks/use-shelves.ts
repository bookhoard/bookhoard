"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { type Shelf } from "@/lib/shelves";

async function fetchShelves(): Promise<Shelf[]> {
  const res = await fetch("/api/shelves");
  if (!res.ok) return [];
  const data = await res.json();
  return data.shelves as Shelf[];
}

/**
 * Bucket-backed shelves, scoped per profile server-side (via the active
 * profile cookie). Mutations apply optimistically for a snappy UI; on
 * failure (e.g. blocked in the read-only demo) the change is rolled back by
 * refetching the server's actual state, so the two can never drift.
 */
export function useShelves(profileId: string) {
  const [shelves, setShelves] = React.useState<Shelf[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    fetchShelves().then((next) => {
      if (cancelled) return;
      setShelves(next);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const resync = React.useCallback(async (message: string) => {
    toast.add({ title: message, type: "error" });
    setShelves(await fetchShelves());
  }, []);

  const createShelf = React.useCallback(
    (name: string, color?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      void (async () => {
        const res = await fetch("/api/shelves", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed, color }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          await resync(data.error ?? "Couldn't create shelf");
          return;
        }
        const { shelf } = await res.json();
        setShelves((prev) => [...prev, shelf as Shelf]);
      })();
    },
    [resync]
  );

  const deleteShelf = React.useCallback(
    (id: string) => {
      setShelves((prev) => prev.filter((shelf) => shelf.id !== id));
      void (async () => {
        const res = await fetch(`/api/shelves/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          await resync(data.error ?? "Couldn't delete shelf");
        }
      })();
    },
    [resync]
  );

  const renameShelf = React.useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setShelves((prev) =>
        prev.map((shelf) => (shelf.id === id ? { ...shelf, name: trimmed } : shelf))
      );
      void (async () => {
        const res = await fetch(`/api/shelves/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          await resync(data.error ?? "Couldn't rename shelf");
        }
      })();
    },
    [resync]
  );

  const recolorShelf = React.useCallback(
    (id: string, color: string) => {
      setShelves((prev) =>
        prev.map((shelf) => (shelf.id === id ? { ...shelf, color } : shelf))
      );
      void (async () => {
        const res = await fetch(`/api/shelves/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ color }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          await resync(data.error ?? "Couldn't recolor shelf");
        }
      })();
    },
    [resync]
  );

  const toggleBookInShelf = React.useCallback(
    (shelfId: string, bookId: string) => {
      const shelf = shelves.find((s) => s.id === shelfId);
      const inShelf = shelf?.bookIds.includes(bookId) ?? false;

      setShelves((prev) =>
        prev.map((s) =>
          s.id === shelfId
            ? {
                ...s,
                bookIds: inShelf
                  ? s.bookIds.filter((id) => id !== bookId)
                  : [...s.bookIds, bookId],
              }
            : s
        )
      );

      void (async () => {
        const res = inShelf
          ? await fetch(`/api/shelves/${shelfId}/books/${bookId}`, { method: "DELETE" })
          : await fetch(`/api/shelves/${shelfId}/books`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookId }),
            });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          await resync(data.error ?? "Couldn't update shelf");
        }
      })();
    },
    [shelves, resync]
  );

  // Idempotent add (unlike toggle) — the right semantics for a drag-and-drop
  // gesture, where dropping the same book on a shelf twice shouldn't remove it.
  const addBookToShelf = React.useCallback(
    (shelfId: string, bookId: string) => {
      setShelves((prev) =>
        prev.map((shelf) =>
          shelf.id === shelfId && !shelf.bookIds.includes(bookId)
            ? { ...shelf, bookIds: [...shelf.bookIds, bookId] }
            : shelf
        )
      );
      void (async () => {
        const res = await fetch(`/api/shelves/${shelfId}/books`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          await resync(data.error ?? "Couldn't add book to shelf");
        }
      })();
    },
    [resync]
  );

  return {
    shelves,
    loaded,
    createShelf,
    deleteShelf,
    renameShelf,
    recolorShelf,
    toggleBookInShelf,
    addBookToShelf,
  };
}
