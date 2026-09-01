import { describe, expect, it } from "vitest";
import {
  ACQUISITION_TYPE,
  NAVIGATION_TYPE,
  buildAcquisitionFeed,
  buildNavigationFeed,
  escapeXml,
} from "./atom";
import type { BookRecord } from "@/lib/books/types";

function bookRecord(overrides: Partial<BookRecord> & Pick<BookRecord, "id">): BookRecord {
  return {
    contentHash: "hash",
    title: "Title",
    author: "Author",
    size: 0,
    addedAt: "2024-01-01T00:00:00.000Z",
    hasCover: false,
    ...overrides,
  };
}

describe("escapeXml", () => {
  it("escapes all five XML special characters", () => {
    expect(escapeXml(`<a & "b" 'c'>`)).toBe("&lt;a &amp; &quot;b&quot; &apos;c&apos;&gt;");
  });

  it("leaves plain text untouched", () => {
    expect(escapeXml("Dracula")).toBe("Dracula");
  });
});

describe("buildNavigationFeed", () => {
  it("escapes untrusted entry content so it can't break out of the XML", () => {
    const xml = buildNavigationFeed({
      id: "root",
      title: "Library",
      selfHref: "/opds",
      entries: [{ id: "1", title: "<script>alert(1)</script>", summary: "a & b", href: "/x" }],
    });
    expect(xml).not.toContain("<script>alert(1)</script>");
    expect(xml).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(xml).toContain(`type="${NAVIGATION_TYPE}"`);
  });
});

describe("buildAcquisitionFeed", () => {
  const books = [bookRecord({ id: "a" }), bookRecord({ id: "b" })];

  it("escapes untrusted book metadata", () => {
    const malicious = bookRecord({
      id: "evil",
      title: `Title</title><script>alert(1)</script>`,
      author: `A & B`,
    });
    const xml = buildAcquisitionFeed({
      id: "all",
      title: "All Books",
      selfHref: "/opds/all",
      books: [malicious],
      page: 1,
      pageSize: 10,
      totalCount: 1,
    });
    expect(xml).not.toContain("<script>");
    expect(xml).toContain("&lt;script&gt;");
    expect(xml).toContain("A &amp; B");
  });

  it("omits a previous link on the first page and a next link on the last page", () => {
    const xml = buildAcquisitionFeed({
      id: "all",
      title: "All Books",
      selfHref: "/opds/all",
      books,
      page: 1,
      pageSize: 10,
      totalCount: 2,
    });
    expect(xml).not.toContain('rel="previous"');
    expect(xml).not.toContain('rel="next"');
  });

  it("includes both prev and next links on a middle page", () => {
    const xml = buildAcquisitionFeed({
      id: "all",
      title: "All Books",
      selfHref: "/opds/all",
      books,
      page: 2,
      pageSize: 1,
      totalCount: 3,
    });
    expect(xml).toContain('rel="previous" href="/opds/all?page=1"');
    expect(xml).toContain('rel="next" href="/opds/all?page=3"');
  });

  it("strips existing query params from paging link hrefs", () => {
    const xml = buildAcquisitionFeed({
      id: "all",
      title: "All Books",
      selfHref: "/opds/all?page=1",
      books,
      page: 1,
      pageSize: 1,
      totalCount: 2,
    });
    expect(xml).toContain('rel="next" href="/opds/all?page=2"');
  });

  it("reports the acquisition content type on the self link", () => {
    const xml = buildAcquisitionFeed({
      id: "all",
      title: "All Books",
      selfHref: "/opds/all",
      books,
      page: 1,
      pageSize: 10,
      totalCount: 2,
    });
    expect(xml).toContain(`rel="self" href="/opds/all" type="${ACQUISITION_TYPE}"`);
  });
});
