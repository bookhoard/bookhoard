"use client";

import { BookOpenText } from "lucide-react";
import { BookGrid } from "@/components/library/book-grid";
import { LibrarySortMenu } from "@/components/library/library-sort-menu";
import { useLibraryShell } from "@/components/library/library-shell-context";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useBookSort } from "@/hooks/use-book-sort";
import { sortBooks } from "@/lib/books/sort";

export default function ReadingNowPage() {
  useDocumentTitle("Reading Now");
  const { books, selected, setSelected, bookCardActions } = useLibraryShell();
  const [sort, changeSort] = useBookSort("bookhoard:reading-now-sort", "recently-read");

  const readingNow = books.filter((book) => book.progress !== undefined);

  return (
    <BookGrid
      title="Reading Now"
      books={sortBooks(readingNow, sort)}
      selectedId={selected?.id}
      onSelect={setSelected}
      actions={bookCardActions}
      emptyIcon={BookOpenText}
      emptyTitle="Nothing in progress"
      emptyMessage="Open a book from your library and start reading to see it here."
      titleActions={readingNow.length > 0 ? <LibrarySortMenu value={sort} onChange={changeSort} /> : null}
    />
  );
}
