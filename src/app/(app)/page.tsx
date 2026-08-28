"use client";

import { LibraryBig } from "lucide-react";
import { RecentlyRead } from "@/components/library/recently-read";
import { BookGrid } from "@/components/library/book-grid";
import { LibraryDropZone, UploadPlaceholderCard } from "@/components/library/library-drop-zone";
import { useLibraryShell } from "@/components/library/library-shell-context";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function LibraryPage() {
  useDocumentTitle("Library");
  const { books, selected, setSelected, bookCardActions } = useLibraryShell();

  const readingNow = books
    .filter((book) => book.progress !== undefined)
    .sort((a, b) => (b.lastReadAt ?? "").localeCompare(a.lastReadAt ?? ""));
  const recentlyReadBook = readingNow[0];

  return (
    <LibraryDropZone>
      {(dragging) => (
        <>
          {recentlyReadBook && <RecentlyRead book={recentlyReadBook} onSelect={setSelected} />}
          <BookGrid
            title="Your Library"
            books={books}
            selectedId={selected?.id}
            onSelect={setSelected}
            actions={bookCardActions}
            emptyIcon={LibraryBig}
            emptyTitle="Your library is empty"
            emptyMessage="Use the upload button in the top-right corner to add your first EPUB."
            leadingSlot={dragging ? <UploadPlaceholderCard /> : null}
          />
        </>
      )}
    </LibraryDropZone>
  );
}
