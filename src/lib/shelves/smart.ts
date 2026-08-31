import { BookOpenText, BookCheck, CircleDashed, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Book } from "@/lib/books/types";

/** Computed, non-editable pseudo-shelves — derived from a profile's reading
 * state on every render, never persisted. Kept structurally compatible with
 * `Shelf` ({id, name, bookIds}) so `/shelf/[id]` can render either. */
export interface SmartShelf {
  id: string;
  name: string;
  icon: LucideIcon;
  bookIds: string[];
}

/** Matches the "reading now" predicate previously used by the standalone
 * Reading Now nav page — this shelf replaced it, see app-sidebar.tsx. */
export function computeSmartShelves(books: Book[]): SmartShelf[] {
  return [
    {
      id: "unread",
      name: "Unread",
      icon: CircleDashed,
      bookIds: books.filter((b) => !b.read && b.progress === undefined).map((b) => b.id),
    },
    {
      id: "currently-reading",
      name: "Currently Reading",
      icon: BookOpenText,
      bookIds: books.filter((b) => !b.read && b.progress !== undefined).map((b) => b.id),
    },
    {
      id: "finished",
      name: "Finished",
      icon: BookCheck,
      bookIds: books.filter((b) => b.read).map((b) => b.id),
    },
    {
      id: "5-star",
      name: "5-Star",
      icon: Star,
      bookIds: books.filter((b) => b.rating === 5).map((b) => b.id),
    },
  ];
}
