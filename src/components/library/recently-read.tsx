import { CalendarDays, FileText } from "lucide-react";
import { BookCover } from "./book-cover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatAddedDate, formatBytes } from "@/lib/format";
import type { Book } from "@/lib/books/types";

interface RecentlyReadProps {
  book: Book;
  onSelect: (book: Book) => void;
}

export function RecentlyRead({ book, onSelect }: RecentlyReadProps) {
  return (
    <section>
      <h2 className="mb-4 font-heading text-lg font-bold tracking-tight">
        Recently Read
      </h2>
      <div className="flex gap-3 rounded-xl border border-border bg-card p-3 sm:gap-5 sm:p-5">
        <BookCover title={book.title} coverUrl={book.coverUrl} className="w-20 sm:w-28" />
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <h3 className="font-heading text-lg font-bold leading-snug text-balance">
              {book.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Added {formatAddedDate(book.addedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5" />
                {formatBytes(book.size)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
            <Button className="rounded-full" size="sm" onClick={() => onSelect(book)}>
              Continue Reading
            </Button>
            {book.progress !== undefined && (
              <div className="flex min-w-24 flex-1 items-center gap-2 sm:max-w-56">
                <Progress value={book.progress} className="h-1.5" />
                <span className="text-xs font-medium text-muted-foreground">
                  {book.progress}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
