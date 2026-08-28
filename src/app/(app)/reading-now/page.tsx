"use client";

import { BookOpenText } from "lucide-react";
import { BookGrid } from "@/components/library/book-grid";
import { useLibraryShell } from "@/components/library/library-shell-context";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function ReadingNowPage() {
  useDocumentTitle("Reading Now");
  const { books, selected, setSelected, bookCardActions } = useLibraryShell();

  const readingNow = books
    .filter((book) => book.progress !== undefined)
    .sort((a, b) => (b.lastReadAt ?? "").localeCompare(a.lastReadAt ?? ""));

  return (
    <BookGrid
      title="Reading Now"
      books={readingNow}
      selectedId={selected?.id}
      onSelect={setSelected}
      actions={bookCardActions}
      emptyIcon={BookOpenText}
      emptyTitle="Nothing in progress"
      emptyMessage="Open a book from your library and start reading to see it here."
    />
  );
}
