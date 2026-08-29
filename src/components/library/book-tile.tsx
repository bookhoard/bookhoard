import { cn } from "@/lib/utils";
import { BookCover } from "./book-cover";

export function bookTileClassName(selected?: boolean) {
  return cn(
    "group w-full cursor-pointer overflow-hidden rounded-xl p-2 text-left transition-colors hover:bg-accent/60 sm:w-40 sm:shrink-0",
    selected && "bg-accent"
  );
}

interface BookTileProps {
  title: string;
  author: string;
  coverUrl?: string | null;
  /** Overlaid on the cover, e.g. a "read" checkmark badge. */
  badge?: React.ReactNode;
}

/** Cover + title/author block shared by every grid that displays books (library, reading now, trending). */
export function BookTile({ title, author, coverUrl, badge }: BookTileProps) {
  return (
    <>
      <div className="relative">
        <BookCover title={title} coverUrl={coverUrl} />
        {badge}
      </div>
      <p className="mt-3 line-clamp-1 text-sm font-semibold">{title}</p>
      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{author}</p>
    </>
  );
}
