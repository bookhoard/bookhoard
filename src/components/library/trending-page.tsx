"use client";

import * as React from "react";
import { Loader2, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRENDING_PERIODS, type TrendingBook, type TrendingPeriod } from "@/lib/trending";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { BookGridLayout } from "./book-grid";
import { BookTile, bookTileClassName } from "./book-tile";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function TrendingPage() {
  useDocumentTitle("Trending");
  const [period, setPeriod] = React.useState<TrendingPeriod>("weekly");
  const [books, setBooks] = React.useState<TrendingBook[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/trending?period=${period}`)
      .then((res) => res.json())
      .then((data: { books: TrendingBook[] }) => {
        if (!cancelled) setBooks(data.books ?? []);
      })
      .catch(() => {
        if (!cancelled) setBooks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <section>
      <div className="mb-6 flex items-center gap-1 rounded-full border border-border p-1 w-fit">
        {TRENDING_PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              period === p.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading trending books…
        </div>
      ) : books.length === 0 ? (
        <Empty className="border py-24">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrendingDown />
            </EmptyMedia>
            <EmptyTitle>Couldn&rsquo;t load trending books right now.</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <BookGridLayout>
          {books.map((book) => (
            <a
              key={book.key}
              href={`https://openlibrary.org${book.key}`}
              target="_blank"
              rel="noreferrer"
              className={bookTileClassName()}
            >
              <BookTile
                title={book.title}
                author={book.authors?.join(", ") ?? "Unknown author"}
                coverUrl={book.coverUrl}
              />
            </a>
          ))}
        </BookGridLayout>
      )}
    </section>
  );
}
