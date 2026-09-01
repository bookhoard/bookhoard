import { describe, expect, it } from "vitest";
import { parseEpubMetadata } from "./metadata";
import { buildEpub, CONTAINER_XML, opfXml } from "./test-helpers";

describe("parseEpubMetadata", () => {
  it("extracts title, author, language, and ISBN from the OPF", () => {
    const epub = buildEpub({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opfXml({
        title: "Dracula",
        author: "Bram Stoker",
        language: "en",
        isbn: "9780486411095",
      }),
    });
    const meta = parseEpubMetadata(epub);
    expect(meta.title).toBe("Dracula");
    expect(meta.author).toBe("Bram Stoker");
    expect(meta.language).toBe("en");
    expect(meta.isbn).toBe("9780486411095");
    expect(meta.opfPath).toBe("OEBPS/content.opf");
    expect(meta.opfDir).toBe("OEBPS/");
  });

  it("defaults title to Untitled and author to Unknown when missing", () => {
    const epub = buildEpub({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opfXml({}),
    });
    const meta = parseEpubMetadata(epub);
    expect(meta.title).toBe("Untitled");
    expect(meta.author).toBe("Unknown");
  });

  it("throws when META-INF/container.xml is missing", () => {
    const epub = buildEpub({
      "OEBPS/content.opf": opfXml({ title: "X", author: "Y" }),
    });
    expect(() => parseEpubMetadata(epub)).toThrow(/container\.xml/);
  });

  it("throws when container.xml has no rootfile", () => {
    const epub = buildEpub({
      "META-INF/container.xml": `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles></rootfiles>
</container>`,
    });
    expect(() => parseEpubMetadata(epub)).toThrow(/rootfile/);
  });

  it("throws when the referenced OPF file is missing from the archive", () => {
    const epub = buildEpub({
      "META-INF/container.xml": CONTAINER_XML,
    });
    expect(() => parseEpubMetadata(epub)).toThrow(/OPF file/);
  });

  it("picks the identifier with an ISBN scheme among several identifiers", () => {
    const epub = buildEpub({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opfXml({
        title: "X",
        author: "Y",
        metaItems: `<dc:identifier xmlns:dc="http://purl.org/dc/elements/1.1/" id="uuid">urn:uuid:1234</dc:identifier>
        <dc:identifier xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf" opf:scheme="ISBN">1234567890</dc:identifier>`,
      }),
    });
    const meta = parseEpubMetadata(epub);
    expect(meta.isbn).toBe("1234567890");
  });

  it("finds the cover id via a manifest item with properties=cover-image", () => {
    const epub = buildEpub({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opfXml({
        title: "X",
        author: "Y",
        manifestItems: `<item id="cover-img" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>`,
      }),
    });
    const meta = parseEpubMetadata(epub);
    expect(meta.coverId).toBe("cover-img");
    expect(meta.manifest["cover-img"]).toEqual({
      href: "cover.jpg",
      mediaType: "image/jpeg",
      properties: "cover-image",
    });
  });

  it("falls back to a <meta name=\"cover\"> reference when no manifest item has properties=cover-image", () => {
    const epub = buildEpub({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opfXml({
        title: "X",
        author: "Y",
        metaItems: `<meta name="cover" content="my-cover"/>`,
        manifestItems: `<item id="my-cover" href="cover.jpg" media-type="image/jpeg"/>`,
      }),
    });
    const meta = parseEpubMetadata(epub);
    expect(meta.coverId).toBe("my-cover");
  });

  it("prefers the properties=cover-image item over the meta name=cover fallback", () => {
    const epub = buildEpub({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opfXml({
        title: "X",
        author: "Y",
        metaItems: `<meta name="cover" content="legacy-cover"/>`,
        manifestItems: `<item id="legacy-cover" href="old.jpg" media-type="image/jpeg"/>
        <item id="new-cover" href="new.jpg" media-type="image/jpeg" properties="cover-image"/>`,
      }),
    });
    const meta = parseEpubMetadata(epub);
    expect(meta.coverId).toBe("new-cover");
  });

  it("leaves coverId undefined when there is no cover reference at all", () => {
    const epub = buildEpub({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opfXml({ title: "X", author: "Y" }),
    });
    const meta = parseEpubMetadata(epub);
    expect(meta.coverId).toBeUndefined();
  });
});
