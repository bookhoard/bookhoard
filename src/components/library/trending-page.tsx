"use client";

import * as React from "react";
import Image from "next/image";
import { BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRENDING_PERIODS, type TrendingBook, type TrendingPeriod } from "@/lib/trending";
import { useDocumentTitle } from "@/hooks/use-document-title";

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
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-24 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn&rsquo;t load trending books right now.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {books.map((book) => (
            <a
              key={book.key}
              href={`https://openlibrary.org${book.key}`}
              target="_blank"
              rel="noreferrer"
              className="group w-40 shrink-0 rounded-xl p-2 text-left transition-colors hover:bg-accent/60"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-muted">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="size-6 text-foreground/15" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <p className="mt-3 line-clamp-1 text-sm font-semibold">{book.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {book.authors?.join(", ") ?? "Unknown author"}
              </p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
