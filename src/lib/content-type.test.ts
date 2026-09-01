import { describe, expect, it } from "vitest";
import { contentTypeFor } from "./content-type";

describe("contentTypeFor", () => {
  it("resolves known extensions", () => {
    expect(contentTypeFor("book.epub")).toBe("application/epub+zip");
    expect(contentTypeFor("cover.jpg")).toBe("image/jpeg");
    expect(contentTypeFor("cover.jpeg")).toBe("image/jpeg");
    expect(contentTypeFor("data.json")).toBe("application/json");
  });

  it("is case-insensitive on the extension", () => {
    expect(contentTypeFor("COVER.PNG")).toBe("image/png");
  });

  it("resolves a nested path by its final extension", () => {
    expect(contentTypeFor("books/dracula/content/OEBPS/toc.ncx")).toBe(
      "application/x-dtbncx+xml"
    );
  });

  it("falls back to application/octet-stream for unknown extensions", () => {
    expect(contentTypeFor("book.mobi")).toBe("application/octet-stream");
  });

  it("falls back to application/octet-stream when there is no extension", () => {
    expect(contentTypeFor("README")).toBe("application/octet-stream");
  });
});
