"use client";

import * as React from "react";
import type { BookSort } from "@/lib/books/sort";

/** Per-viewer sort choice for a book grid, persisted in localStorage under `storageKey`. */
export function useBookSort(
  storageKey: string,
  defaultSort: BookSort
): [BookSort, (next: BookSort) => void] {
  const [sort, setSort] = React.useState<BookSort>(defaultSort);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setSort(stored as BookSort);
    } catch {
      // localStorage unavailable (e.g. private browsing) — just keep the default
    }
  }, [storageKey]);

  const changeSort = React.useCallback(
    (next: BookSort) => {
      setSort(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // localStorage unavailable — sort choice just won't persist
      }
    },
    [storageKey]
  );

  return [sort, changeSort];
}
