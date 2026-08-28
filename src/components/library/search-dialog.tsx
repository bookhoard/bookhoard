"use client";

import * as React from "react";
import { Search, BookOpen, SearchX } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookCover } from "./book-cover";
import { useLibraryShell } from "./library-shell-context";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { books, setSelected } = useLibraryShell();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = q
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q)
      )
    : [];

  const pick = (book: (typeof books)[number]) => {
    setSelected(book);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your library by title or author…"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-[26rem] overflow-y-auto p-2">
          {!q ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Search className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">
                Start typing to search your library.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <SearchX className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">No matches for “{query.trim()}”</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {results.map((book) => (
                <li key={book.id}>
                  <button
                    type="button"
                    onClick={() => pick(book)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent"
                  >
                    <div className="w-9 shrink-0">
                      <BookCover title={book.title} coverUrl={book.coverUrl} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{book.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                    </div>
                    <BookOpen className="size-4 shrink-0 text-muted-foreground/50" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
