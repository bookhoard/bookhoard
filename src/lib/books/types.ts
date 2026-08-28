export interface BookRecord {
  /** slug — also the directory name under books/, e.g. books/dracula/ */
  id: string;
  /** sha256 of the epub bytes, used for dedupe */
  contentHash: string;
  title: string;
  author: string;
  isbn?: string;
  lang?: string;
  size: number;
  addedAt: string;
  hasCover: boolean;
  coverExt?: string;
  /** when the cover file was last written — busts the cache when it's replaced */
  coverUpdatedAt?: string;
  description?: string;
  /**
   * Path to the package document within the extracted content/ tree, e.g.
   * "OEBPS/content.opf". The reader opens this instead of the raw .epub —
   * epub.js's archived-URL mode never resolves `book.opened` reliably.
   * Unset on books uploaded before extraction was added; re-upload to fix.
   */
  opfPath?: string;
}

/**
 * UI-facing shape: a book record plus a resolved cover URL and the active
 * profile's reading state. Rating/read/progress/cfi/lastReadAt live in
 * profiles/<id>/state.json, not on the shared BookRecord — see
 * lib/profiles/state.ts#applyProfileState.
 */
export interface Book extends BookRecord {
  coverUrl: string | null;
  /** 1-5, unset means unrated */
  rating?: number;
  read?: boolean;
  /** last reading position, as an EPUB CFI */
  cfi?: string;
  /** 0-100, derived from cfi against the book's generated locations */
  progress?: number;
  /** when the reader last saved a position — drives "Recently Read" */
  lastReadAt?: string;
}

export function bookCoverUrl(
  record: Pick<BookRecord, "id" | "hasCover" | "coverExt" | "coverUpdatedAt">
): string | null {
  if (!record.hasCover || !record.coverExt) return null;
  const base = `/api/files/books/${record.id}/cover.${record.coverExt}`;
  return record.coverUpdatedAt
    ? `${base}?v=${encodeURIComponent(record.coverUpdatedAt)}`
    : base;
}

export function bookFileUrl(id: string): string {
  return `/api/files/books/${id}/book.epub`;
}

/** URL to the extracted package document epub.js should actually open. */
export function bookOpfUrl(id: string, opfPath: string): string {
  return `/api/files/books/${id}/content/${opfPath}`;
}

/** New uploads have no reading state yet — this is a plain, unread book. */
export function toLibraryBook(record: BookRecord): Book {
  return { ...record, coverUrl: bookCoverUrl(record) };
}
