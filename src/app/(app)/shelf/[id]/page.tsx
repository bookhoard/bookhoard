"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { BookGrid } from "@/components/library/book-grid";
import { useLibraryShell } from "@/components/library/library-shell-context";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function ShelfPage() {
  const params = useParams<{ id: string }>();
  const { books, shelves, smartShelves, selected, setSelected, bookCardActions } = useLibraryShell();
  const smartShelf = smartShelves.find((s) => s.id === params.id);
  const shelf = shelves.find((s) => s.id === params.id) ?? smartShelf;
  const shelfBooks = shelf ? books.filter((book) => shelf.bookIds.includes(book.id)) : [];
  useDocumentTitle(shelf?.name ?? "Shelf");

  // matches the old view-switch behavior of auto-opening the first book on
  // the shelf when you land here with nothing selected yet
  React.useEffect(() => {
    if (shelf && shelfBooks.length > 0 && !selected) {
      setSelected(shelfBooks[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelf?.id]);

  return (
    <BookGrid
      title={shelf?.name ?? "Shelf"}
      books={shelfBooks}
      selectedId={selected?.id}
      onSelect={setSelected}
      actions={bookCardActions}
      emptyIcon={FolderOpen}
      emptyTitle="This shelf is empty"
      emptyMessage={
        smartShelf
          ? "Books appear here automatically based on their reading status or rating."
          : "Select a book and use “Add to shelf” to add it here."
      }
    />
  );
}
