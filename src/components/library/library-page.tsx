"use client";

import * as React from "react";
import { LibraryBig, Tag } from "lucide-react";
import { RecentlyRead } from "@/components/library/recently-read";
import { BookGrid } from "@/components/library/book-grid";
import { LibraryDropZone, UploadPlaceholderCard } from "@/components/library/library-drop-zone";
import { LibrarySortMenu } from "@/components/library/library-sort-menu";
import { TagFilterMenu } from "@/components/library/tag-filter-menu";
import { useLibraryShell } from "@/components/library/library-shell-context";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useBookSort } from "@/hooks/use-book-sort";
import { DEMO_MODE } from "@/lib/demo-mode";
import { sortBooks } from "@/lib/books/sort";

export function LibraryPage() {
  useDocumentTitle("Library");
  const { books, selected, setSelected, bookCardActions } = useLibraryShell();
  const [sort, changeSort] = useBookSort("bookhoard:library-sort", "recent");
  // Intentionally not persisted — a leftover filter from a past session
  // silently hiding every book (and looking exactly like an empty library)
  // is worse than just having to reselect it.
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const readingNow = books
    .filter((book) => book.progress !== undefined)
    .sort((a, b) => (b.lastReadAt ?? "").localeCompare(a.lastReadAt ?? ""));
  const recentlyReadBook = readingNow[0];

  const filteredBooks = selectedTags.length
    ? books.filter((book) => selectedTags.every((tag) => (book.tags ?? []).includes(tag)))
    : books;
  const filteredToNothing = books.length > 0 && filteredBooks.length === 0;

  return (
    <LibraryDropZone>
      {(dragging) => (
        <>
          {recentlyReadBook && <RecentlyRead book={recentlyReadBook} onSelect={setSelected} />}
          <BookGrid
            title="Your Library"
            books={sortBooks(filteredBooks, sort)}
            selectedId={selected?.id}
            onSelect={setSelected}
            actions={bookCardActions}
            emptyIcon={filteredToNothing ? Tag : LibraryBig}
            emptyTitle={filteredToNothing ? "No books match these tags" : "Your library is empty"}
            emptyMessage={
              filteredToNothing
                ? "Clear the tag filter above to see your whole library."
                : DEMO_MODE
                  ? "This demo only shows what's already in the bucket — uploads are disabled."
                  : "Use the upload button in the top-right corner to add your first EPUB."
            }
            leadingSlot={dragging ? <UploadPlaceholderCard /> : null}
            titleActions={
              books.length > 0 ? (
                <div className="flex gap-2">
                  <TagFilterMenu books={books} value={selectedTags} onChange={setSelectedTags} />
                  <LibrarySortMenu value={sort} onChange={changeSort} />
                </div>
              ) : null
            }
          />
        </>
      )}
    </LibraryDropZone>
  );
}
