import { openLibraryUserAgent } from "./user-agent";

export interface MetadataLookupResult {
  /** Open Library work key, e.g. "/works/OL166894W" — used to lazily fetch the description */
  key?: string;
  title?: string;
  authors?: string[];
  language?: string;
  description?: string;
  coverUrl?: string;
}

interface OpenLibraryIsbnResponse {
  title?: string;
  covers?: number[];
  description?: string | { value: string };
}

interface OpenLibrarySearchDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  language?: string[];
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibrarySearchDoc[];
}

interface OpenLibraryWorkResponse {
  description?: string | { value: string };
  covers?: number[];
}

interface OpenLibraryEditionDoc {
  key?: string;
  title?: string;
  covers?: number[];
  languages?: { key: string }[];
  works?: { key: string }[];
  /** Rare — most editions don't carry their own description, only the work does */
  description?: string | { value: string };
}

interface OpenLibraryEditionsResponse {
  entries?: OpenLibraryEditionDoc[];
}

function descriptionText(value: string | { value: string } | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.value;
}

function languageLabel(key?: string): string | undefined {
  return key?.replace("/languages/", "");
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: { "User-Agent": openLibraryUserAgent() } });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/**
 * Up to `limit` candidates so the caller can pick the right edition. Rather
 * than a loose full-text search (which mixes in unrelated books), this finds
 * the single best-matching work by title+author, then lists up to one
 * candidate per language from that work's editions — so the carousel shows
 * the SAME book across languages instead of different books entirely.
 * No confidence scoring or auto-apply here (see plans/2.md for the fuller
 * sync design); the user picks.
 */
export async function lookupOpenLibraryCandidates(
  query: {
    isbn?: string;
    title: string;
    author: string;
  },
  limit = 10
): Promise<MetadataLookupResult[]> {
  const candidates: MetadataLookupResult[] = [];

  if (query.isbn) {
    const byIsbn = await fetchJson<OpenLibraryIsbnResponse>(
      `https://openlibrary.org/isbn/${encodeURIComponent(query.isbn)}.json`
    );
    if (byIsbn) {
      candidates.push({
        title: byIsbn.title,
        description: descriptionText(byIsbn.description),
        coverUrl: byIsbn.covers?.[0]
          ? `https://covers.openlibrary.org/b/id/${byIsbn.covers[0]}-L.jpg`
          : undefined,
      });
    }
  }

  const titleParam = encodeURIComponent(query.title);
  const authorParam = encodeURIComponent(query.author);
  const workSearch = await fetchJson<OpenLibrarySearchResponse>(
    `https://openlibrary.org/search.json?title=${titleParam}&author=${authorParam}&fields=key,title,author_name&limit=1`
  );
  const work = workSearch?.docs?.[0];

  if (work?.key) {
    const [editions, workDetail] = await Promise.all([
      fetchJson<OpenLibraryEditionsResponse>(`https://openlibrary.org${work.key}/editions.json?limit=50`),
      fetchJson<OpenLibraryWorkResponse>(`https://openlibrary.org${work.key}.json`),
    ]);
    const entries = editions?.entries ?? [];
    // Most editions don't carry their own cover even when the work has one —
    // fall back to the work's cover so candidates aren't left blank.
    const workCoverUrl = workDetail?.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${workDetail.covers[0]}-L.jpg`
      : undefined;

    // One edition per language — preferring whichever has a cover — so the
    // carousel reads as "this book, in each language" rather than a pile of
    // near-duplicate reprints.
    const byLanguage = new Map<string, OpenLibraryEditionDoc>();
    for (const edition of entries) {
      const lang = languageLabel(edition.languages?.[0]?.key) ?? "unknown";
      const existing = byLanguage.get(lang);
      if (!existing || (!existing.covers?.length && edition.covers?.length)) {
        byLanguage.set(lang, edition);
      }
    }

    const englishFirst = (a: [string, OpenLibraryEditionDoc], b: [string, OpenLibraryEditionDoc]) => {
      const aEng = a[0] === "eng" ? 0 : 1;
      const bEng = b[0] === "eng" ? 0 : 1;
      return aEng - bEng;
    };

    for (const [lang, edition] of [...byLanguage.entries()].sort(englishFirst)) {
      candidates.push({
        key: edition.works?.[0]?.key ?? work.key,
        title: edition.title || work.title,
        authors: work.author_name,
        language: lang === "unknown" ? undefined : lang,
        // Prefer the edition's own description (rare) over the work's
        // (language-independent, but still better than an empty state).
        description: descriptionText(edition.description) ?? descriptionText(workDetail?.description),
        coverUrl: edition.covers?.[0]
          ? `https://covers.openlibrary.org/b/id/${edition.covers[0]}-L.jpg`
          : workCoverUrl,
      });
      if (candidates.length >= limit) break;
    }
  }

  // Fall back to a loose full-text search if no work matched (or it has no
  // editions on record) so a lookup still returns something.
  if (candidates.length === 0) {
    const q = encodeURIComponent(`${query.title} ${query.author}`.trim());
    const search = await fetchJson<OpenLibrarySearchResponse>(
      `https://openlibrary.org/search.json?q=${q}&fields=key,title,author_name,cover_i,language&limit=${limit}`
    );
    for (const doc of search?.docs ?? []) {
      candidates.push({
        key: doc.key,
        title: doc.title,
        authors: doc.author_name,
        language: doc.language?.[0],
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : undefined,
      });
    }
  }

  return candidates.slice(0, limit);
}

/** Lazy fetch — only called for whichever candidate the user actually picks. */
export async function fetchOpenLibraryDescription(key: string): Promise<string | undefined> {
  const work = await fetchJson<OpenLibraryWorkResponse>(`https://openlibrary.org${key}.json`);
  return descriptionText(work?.description);
}
