import type { BookRecord } from "@/lib/books/types";
import { bookCoverUrl, bookFileUrl } from "@/lib/books/types";

/**
 * OPDS 1.2 (Atom) catalog feeds — the protocol most e-reader apps (KOReader,
 * Moon+, Marvin, ...) use to browse and download from a self-hosted library
 * directly, instead of relying on "send to e-reader" email round-trips.
 *
 * Scoped app-wide rather than per-profile: shelves/reading state are a
 * per-profile personalization concept with no natural mapping onto a
 * protocol that has no session, and every profile already sees the same
 * shared book library (GET /api/books works the same way).
 */

const ATOM_NS = "http://www.w3.org/2005/Atom";
const OPDS_NS = "http://opds-spec.org/2010/catalog";
const DC_NS = "http://purl.org/dc/terms/";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const NAVIGATION_TYPE = "application/atom+xml;profile=opds-catalog;kind=navigation";
export const ACQUISITION_TYPE = "application/atom+xml;profile=opds-catalog;kind=acquisition";

interface NavEntry {
  id: string;
  title: string;
  summary: string;
  href: string;
}

export function buildNavigationFeed(opts: {
  id: string;
  title: string;
  selfHref: string;
  entries: NavEntry[];
}): string {
  const now = new Date().toISOString();
  const entries = opts.entries
    .map(
      (e) => `  <entry>
    <title>${escapeXml(e.title)}</title>
    <id>${escapeXml(e.id)}</id>
    <updated>${now}</updated>
    <content type="text">${escapeXml(e.summary)}</content>
    <link rel="subsection" href="${escapeXml(e.href)}" type="${ACQUISITION_TYPE}"/>
  </entry>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="${ATOM_NS}" xmlns:opds="${OPDS_NS}">
  <id>${escapeXml(opts.id)}</id>
  <title>${escapeXml(opts.title)}</title>
  <updated>${now}</updated>
  <link rel="self" href="${escapeXml(opts.selfHref)}" type="${NAVIGATION_TYPE}"/>
  <link rel="start" href="/opds" type="${NAVIGATION_TYPE}"/>
  <link rel="search" href="/opds/opensearch" type="application/opensearchdescription+xml"/>
${entries}
</feed>
`;
}

function bookEntry(book: BookRecord): string {
  const coverUrl = bookCoverUrl(book);
  const coverType = book.coverExt === "png" ? "image/png" : "image/jpeg";
  return `  <entry>
    <title>${escapeXml(book.title)}</title>
    <id>urn:bookhoarder:book:${escapeXml(book.id)}</id>
    <updated>${escapeXml(book.addedAt)}</updated>
    <author><name>${escapeXml(book.author)}</name></author>
    ${book.description ? `<summary type="text">${escapeXml(book.description)}</summary>` : ""}
    ${book.lang ? `<dc:language xmlns:dc="${DC_NS}">${escapeXml(book.lang)}</dc:language>` : ""}
    <link rel="http://opds-spec.org/acquisition" href="${escapeXml(bookFileUrl(book.id))}" type="application/epub+zip"/>
    ${coverUrl ? `<link rel="http://opds-spec.org/image" href="${escapeXml(coverUrl)}" type="${coverType}"/>` : ""}
    ${coverUrl ? `<link rel="http://opds-spec.org/image/thumbnail" href="${escapeXml(coverUrl)}" type="${coverType}"/>` : ""}
  </entry>`;
}

export function buildAcquisitionFeed(opts: {
  id: string;
  title: string;
  selfHref: string;
  books: BookRecord[];
  page: number;
  pageSize: number;
  totalCount: number;
}): string {
  const now = new Date().toISOString();
  const totalPages = Math.max(1, Math.ceil(opts.totalCount / opts.pageSize));
  const basePath = opts.selfHref.split("?")[0];

  const pagingLinks = [
    opts.page > 1
      ? `  <link rel="previous" href="${escapeXml(basePath)}?page=${opts.page - 1}" type="${ACQUISITION_TYPE}"/>`
      : null,
    opts.page < totalPages
      ? `  <link rel="next" href="${escapeXml(basePath)}?page=${opts.page + 1}" type="${ACQUISITION_TYPE}"/>`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const entries = opts.books.map(bookEntry).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="${ATOM_NS}" xmlns:opds="${OPDS_NS}" xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">
  <id>${escapeXml(opts.id)}</id>
  <title>${escapeXml(opts.title)}</title>
  <updated>${now}</updated>
  <link rel="self" href="${escapeXml(opts.selfHref)}" type="${ACQUISITION_TYPE}"/>
  <link rel="start" href="/opds" type="${NAVIGATION_TYPE}"/>
  <link rel="up" href="/opds" type="${NAVIGATION_TYPE}"/>
  <link rel="search" href="/opds/opensearch" type="application/opensearchdescription+xml"/>
  <opensearch:totalResults>${opts.totalCount}</opensearch:totalResults>
  <opensearch:itemsPerPage>${opts.pageSize}</opensearch:itemsPerPage>
  <opensearch:startIndex>${(opts.page - 1) * opts.pageSize}</opensearch:startIndex>
${pagingLinks ? pagingLinks + "\n" : ""}${entries}
</feed>
`;
}
