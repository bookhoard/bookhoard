import type { Book } from "./types";

export type BookSort = "recent" | "recently-read" | "title" | "author" | "rating" | "read";

export const BOOK_SORT_OPTIONS: { id: BookSort; label: string }[] = [
  { id: "recent", label: "Recently added" },
  { id: "recently-read", label: "Recently read" },
  { id: "title", label: "Title (A–Z)" },
  { id: "author", label: "Author (A–Z)" },
  { id: "rating", label: "Highest rated" },
  { id: "read", label: "Read first" },
];

export function sortBooks(books: Book[], sort: BookSort): Book[] {
  const sorted = [...books];
  switch (sort) {
    case "recent":
      return sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    case "recently-read":
      return sorted.sort((a, b) => (b.lastReadAt ?? "").localeCompare(a.lastReadAt ?? ""));
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "author":
      return sorted.sort(
        (a, b) => a.author.localeCompare(b.author) || a.title.localeCompare(b.title)
      );
    case "rating":
      return sorted.sort(
        (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.title.localeCompare(b.title)
      );
    case "read":
      return sorted.sort(
        (a, b) => Number(b.read ?? false) - Number(a.read ?? false) || a.title.localeCompare(b.title)
      );
  }
}
