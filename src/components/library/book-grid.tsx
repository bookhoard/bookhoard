"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, LibraryBig } from "lucide-react";
import { BookCard, type BookCardActions } from "./book-card";
import { useLibraryShell } from "./library-shell-context";
import type { Book } from "@/lib/books/types";

/** Grid wrapper shared by every view that lays out book tiles (library, reading now, trending). */
export function BookGridLayout({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap">{children}</div>;
}

interface BookGridProps {
  title: string;
  books: Book[];
  selectedId?: string;
  onSelect: (book: Book) => void;
  actions: BookCardActions;
  emptyIcon?: React.ElementType;
  emptyTitle: string;
  emptyMessage: string;
  /** Extra tile shown before the book cards, e.g. an upload drop placeholder. */
  leadingSlot?: React.ReactNode;
}

export function BookGrid({
  title,
  books,
  selectedId,
  onSelect,
  actions,
  emptyIcon: EmptyIcon = LibraryBig,
  emptyTitle,
  emptyMessage,
  leadingSlot,
}: BookGridProps) {
  const { settings } = useLibraryShell();
  const [page, setPage] = React.useState(1);
  const perPage = settings.booksPerPage;
  const totalPages = Math.max(1, Math.ceil(books.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pageBooks = books.slice(start, start + perPage);

  return (
    <section>
      <h2 className="mb-4 font-heading text-lg font-bold tracking-tight">
        {title}
      </h2>
      {books.length === 0 && !leadingSlot ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <EmptyIcon className="size-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="space-y-1 px-6">
            <p className="text-sm font-semibold">{emptyTitle}</p>
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          </div>
        </div>
      ) : (
        <>
          <BookGridLayout>
            {currentPage === 1 && leadingSlot}
            {pageBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                selected={book.id === selectedId}
                onSelect={onSelect}
                actions={actions}
              />
            ))}
          </BookGridLayout>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
                className="group flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowLeft className="size-5 transition-transform duration-200 ease-out group-hover:-translate-x-px" />
              </button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                className="group flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowRight className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-px" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
