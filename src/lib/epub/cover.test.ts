import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { extractEpubCover } from "./cover";
import type { EpubMetadata } from "./metadata";

function baseMetadata(overrides: Partial<EpubMetadata> = {}): EpubMetadata {
  return {
    title: "Title",
    author: "Author",
    opfPath: "OEBPS/content.opf",
    opfDir: "OEBPS/",
    manifest: {},
    ...overrides,
  };
}

describe("extractEpubCover", () => {
  it("returns null when the metadata has no coverId", () => {
    const epub = Buffer.from(zipSync({}));
    expect(extractEpubCover(epub, baseMetadata())).toBeNull();
  });

  it("returns null when coverId points at a manifest item that doesn't exist", () => {
    const epub = Buffer.from(zipSync({}));
    expect(extractEpubCover(epub, baseMetadata({ coverId: "missing" }))).toBeNull();
  });

  it("extracts the cover bytes, resolving the href relative to the OPF directory", () => {
    const coverBytes = new Uint8Array([1, 2, 3, 4]);
    const epub = Buffer.from(zipSync({ "OEBPS/images/cover.jpg": coverBytes }));
    const metadata = baseMetadata({
      coverId: "cover-img",
      manifest: {
        "cover-img": { href: "images/cover.jpg", mediaType: "image/jpeg" },
      },
    });
    const cover = extractEpubCover(epub, metadata);
    expect(cover).not.toBeNull();
    expect(Array.from(cover!.data)).toEqual([1, 2, 3, 4]);
    expect(cover!.contentType).toBe("image/jpeg");
    expect(cover!.extension).toBe("jpg");
  });

  it("normalizes 'jpeg' media type to a 'jpg' extension", () => {
    const epub = Buffer.from(zipSync({ "OEBPS/cover.jpeg": strToU8("x") }));
    const metadata = baseMetadata({
      coverId: "cover-img",
      manifest: { "cover-img": { href: "cover.jpeg", mediaType: "image/jpeg" } },
    });
    expect(extractEpubCover(epub, metadata)!.extension).toBe("jpg");
  });

  it("decodes a URL-encoded href before resolving it", () => {
    const epub = Buffer.from(zipSync({ "OEBPS/cover image.jpg": strToU8("x") }));
    const metadata = baseMetadata({
      coverId: "cover-img",
      manifest: { "cover-img": { href: "cover%20image.jpg", mediaType: "image/jpeg" } },
    });
    expect(extractEpubCover(epub, metadata)).not.toBeNull();
  });

  it("returns null when the resolved cover path isn't actually in the archive", () => {
    const epub = Buffer.from(zipSync({ "OEBPS/other.jpg": strToU8("x") }));
    const metadata = baseMetadata({
      coverId: "cover-img",
      manifest: { "cover-img": { href: "cover.jpg", mediaType: "image/jpeg" } },
    });
    expect(extractEpubCover(epub, metadata)).toBeNull();
  });
});
