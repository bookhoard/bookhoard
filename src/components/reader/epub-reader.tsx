"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import ePub, {
  type Book as EpubBook,
  type Rendition,
  type Contents,
  type NavItem,
  type Location,
} from "epubjs";
import { ArrowLeft, List, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { bookOpfUrl, type Book } from "@/lib/books/types";

interface EpubReaderProps {
  book: Book;
  initialTocOpen?: boolean;
}

interface FlatTocItem {
  item: NavItem;
  depth: number;
}

function flattenToc(items: NavItem[], depth = 0): FlatTocItem[] {
  return items.flatMap((item) => [
    { item, depth },
    ...flattenToc(item.subitems ?? [], depth + 1),
  ]);
}

type Status = "loading" | "ready" | "error" | "unsupported";

const EPUB_THEMES = {
  light: {
    background: "#ffffff",
    color: "#1a1a1a",
    linkColor: "#2563eb",
  },
  dark: {
    // true black, not a soft dark gray: Chrome's auto-darkening for
    // unstyled iframe content only leaves pure #000 alone — anything
    // near-black-but-not-quite gets silently reverted to white on paint
    background: "#000000",
    color: "#e4e4e7",
    linkColor: "#93c5fd",
  },
};

/**
 * `rendition.themes.select()` registers a stylesheet rule that
 * `getComputedStyle` reports as applied, but Chrome doesn't repaint a
 * freshly-created column-fragmented body for it — the page renders light
 * regardless. Setting inline `!important` colors doesn't help by itself
 * either: re-setting a property to the value it's already computed as is
 * a no-op as far as Blink's invalidation is concerned, so re-applying the
 * same theme color on every relocation never repaints anything that
 * silently failed to paint the first time. Clearing the property first
 * (and forcing a synchronous layout read) guarantees the next set is seen
 * as a genuine change.
 */
function applyEpubTheme(contents: Contents, theme: "light" | "dark") {
  const t = EPUB_THEMES[theme];
  const doc = contents.document;
  for (const el of [doc.documentElement, doc.body]) {
    if (!el) continue;
    el.style.removeProperty("background");
    el.style.removeProperty("background-color");
    el.style.removeProperty("color");
    void el.offsetHeight; // force layout so the removal above isn't coalesced away
    el.style.setProperty("background", t.background, "important");
    el.style.setProperty("background-color", t.background, "important");
    el.style.setProperty("color", t.color, "important");
  }
  const styleId = "bookhoard-theme-links";
  const style = doc.getElementById(styleId) ?? doc.createElement("style");
  style.id = styleId;
  style.textContent = `a, a:link, a:visited { color: ${t.linkColor} !important; }`;
  if (!style.parentNode) (doc.head ?? doc.documentElement)?.appendChild(style);
}

/**
 * The content hook fires before the manager's column/pagination layout
 * pass — applying styles at that point doesn't get painted even though
 * they show up in computed style. Re-applying a couple of frames later,
 * once layout has settled, does.
 */
function applyEpubThemeDeferred(contents: Contents, theme: "light" | "dark") {
  applyEpubTheme(contents, theme);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => applyEpubTheme(contents, theme));
  });
}

/** Queries the rendition for whatever Contents are actually on screen right
 * now, rather than relying on a possibly-stale reference from the content
 * hook (which can fire for a section that gets re-rendered before it's
 * ever shown). */
function applyThemeToRendition(rendition: Rendition, theme: "light" | "dark") {
  const contents = rendition.getContents() as unknown as Contents[];
  for (const c of contents) applyEpubThemeDeferred(c, theme);
}

export function EpubReader({ book, initialTocOpen = false }: EpubReaderProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";
  const themeRef = React.useRef<"light" | "dark">(currentTheme);
  themeRef.current = currentTheme;
  const viewerRef = React.useRef<HTMLDivElement>(null);
  const renditionRef = React.useRef<Rendition | null>(null);
  const pendingWriteRef = React.useRef<{ cfi: string; progress?: number } | null>(null);
  const writeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = React.useState<Status>(
    book.opfPath ? "loading" : "unsupported"
  );
  const [error, setError] = React.useState<string | null>(null);
  const [toc, setToc] = React.useState<FlatTocItem[]>([]);
  const [tocOpen, setTocOpen] = React.useState(initialTocOpen);
  const [progress, setProgress] = React.useState<number | null>(book.progress ?? null);
  const [currentHref, setCurrentHref] = React.useState<string | null>(null);

  const flushNow = React.useCallback(() => {
    if (writeTimerRef.current) {
      clearTimeout(writeTimerRef.current);
      writeTimerRef.current = null;
    }
    const payload = pendingWriteRef.current;
    if (!payload) return Promise.resolve();
    pendingWriteRef.current = null;
    return fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [book.id]);

  const scheduleWrite = React.useCallback(
    (cfi: string, pct?: number) => {
      pendingWriteRef.current = { cfi, progress: pct };
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
      writeTimerRef.current = setTimeout(flushNow, 3000);
    },
    [flushNow]
  );

  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flushNow();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [flushNow]);

  React.useEffect(() => {
    if (!viewerRef.current || !book.opfPath) return;
    let cancelled = false;

    const epubBook: EpubBook = ePub(bookOpfUrl(book.id, book.opfPath));
    const rendition = epubBook.renderTo(viewerRef.current, {
      width: "100%",
      height: "100%",
      spread: "auto",
    });
    renditionRef.current = rendition;

    rendition.hooks.content.register((contents: Contents) => {
      applyEpubThemeDeferred(contents, themeRef.current);
    });

    rendition.on("relocated", (location: Location) => {
      setCurrentHref(location.start.href);
      const pct = Math.round((location.start.percentage ?? 0) * 100);
      setProgress(pct);
      scheduleWrite(location.start.cfi, pct);
      applyThemeToRendition(rendition, themeRef.current);
    });

    // arrow keys while focus is inside the book's iframe never reach a
    // window listener — epub.js re-emits the iframe's DOM events on the
    // rendition itself specifically for this
    rendition.on("keydown", (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") rendition.prev();
      if (e.key === "ArrowRight") rendition.next();
    });

    epubBook.loaded.navigation
      .then((nav) => {
        if (cancelled) return;
        setToc(flattenToc(nav.toc));
      })
      .catch(() => {});

    rendition
      .display(book.cfi || undefined)
      .then(() => {
        if (cancelled) return;
        setStatus("ready");
        applyThemeToRendition(rendition, themeRef.current);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message || "Failed to open this book");
        setStatus("error");
      });

    epubBook.ready
      .then(() => epubBook.locations.generate(1024))
      .then(() => {
        if (cancelled) return;
        const loc = rendition.currentLocation() as unknown as Location | undefined;
        if (loc?.start?.cfi) {
          const pct = Math.round(epubBook.locations.percentageFromCfi(loc.start.cfi) * 100);
          setProgress(pct);
          // the very first "relocated" event fires before locations finish
          // generating, so it saves an inaccurate (often 0%) percentage —
          // this corrects the persisted value once the real one is known
          scheduleWrite(loc.start.cfi, pct);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      flushNow();
      rendition.destroy();
      epubBook.destroy();
    };
    // book.cfi is only used as the initial display position — deliberately excluded
    // so a debounced progress write doesn't tear down and reopen the book
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, book.opfPath, scheduleWrite, flushNow]);

  // swaps the in-page theme without tearing down and reopening the book —
  // themeRef is already current by now (set during render, above), this
  // just re-paints whatever section is already on screen
  React.useEffect(() => {
    if (renditionRef.current) applyThemeToRendition(renditionRef.current, themeRef.current);
  }, [currentTheme]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") renditionRef.current?.prev();
      if (e.key === "ArrowRight") renditionRef.current?.next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Back to library"
            onClick={async () => {
              await flushNow();
              router.push("/");
              router.refresh();
            }}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <p className="truncate text-sm font-medium">{book.title}</p>
        </div>
        <div className="flex items-center gap-3">
          {progress !== null && (
            <span className="text-xs text-muted-foreground">{progress}%</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Chapters"
            onClick={() => setTocOpen((v) => !v)}
          >
            <List className="size-4" />
          </Button>
        </div>
      </header>

      <div className="relative isolate flex flex-1 overflow-hidden">
        {tocOpen && (
          <>
            <div
              className="absolute inset-0 z-30 bg-black/20"
              onClick={() => setTocOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-border bg-card p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-sm font-semibold">Chapters</p>
                <button
                  type="button"
                  onClick={() => setTocOpen(false)}
                  aria-label="Close chapters"
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              {toc.map(({ item, depth }) => (
                <button
                  key={item.id || item.href}
                  type="button"
                  onClick={() => {
                    renditionRef.current?.display(item.href);
                    setTocOpen(false);
                  }}
                  style={{ paddingLeft: `${depth * 12 + 8}px` }}
                  className={cn(
                    "block w-full truncate rounded-md py-1.5 pr-2 text-left text-sm transition-colors hover:bg-accent/60",
                    currentHref && currentHref.includes(item.href.split("#")[0])
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label.trim()}
                </button>
              ))}
            </aside>
          </>
        )}

        <div className="relative min-w-0 flex-1 overflow-hidden">
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Opening book…
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-destructive">
              {error}
            </div>
          )}
          {status === "unsupported" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center text-sm text-muted-foreground">
              <p>This book was added before reading support was ready.</p>
              <p>Delete it and re-upload the EPUB to read it here.</p>
            </div>
          )}

          <div ref={viewerRef} className="h-full w-full" />

          {status === "ready" && (
            <>
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => renditionRef.current?.prev()}
                className="absolute inset-y-0 left-0 z-10 flex w-16 items-center justify-start pl-3"
              >
                <span className="flex size-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent">
                  <ChevronLeft className="size-5" />
                </span>
              </button>
              <button
                type="button"
                aria-label="Next page"
                onClick={() => renditionRef.current?.next()}
                className="absolute inset-y-0 right-0 z-10 flex w-16 items-center justify-end pr-3"
              >
                <span className="flex size-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent">
                  <ChevronRight className="size-5" />
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
