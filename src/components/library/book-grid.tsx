import { LibraryBig } from "lucide-react";
import { BookCard, type BookCardActions } from "./book-card";
import type { Book } from "@/lib/books/types";

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
        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap">
          {leadingSlot}
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              selected={book.id === selectedId}
              onSelect={onSelect}
              actions={actions}
            />
          ))}
        </div>
      )}
    </section>
  );
}
