import { strToU8, zipSync } from "fflate";

/** Builds an in-memory EPUB (zip) from a map of path -> text content, for tests. */
export function buildEpub(files: Record<string, string>): Buffer {
  const zippable: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(files)) {
    zippable[path] = strToU8(content);
  }
  return Buffer.from(zipSync(zippable));
}

export const CONTAINER_XML = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

export function opfXml(opts: {
  title?: string;
  author?: string;
  language?: string;
  isbn?: string;
  manifestItems?: string;
  metaItems?: string;
}): string {
  return `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    ${opts.title !== undefined ? `<dc:title>${opts.title}</dc:title>` : ""}
    ${opts.author !== undefined ? `<dc:creator>${opts.author}</dc:creator>` : ""}
    ${opts.language !== undefined ? `<dc:language>${opts.language}</dc:language>` : ""}
    ${opts.isbn !== undefined ? `<dc:identifier opf:scheme="ISBN">${opts.isbn}</dc:identifier>` : ""}
    ${opts.metaItems ?? ""}
  </metadata>
  <manifest>
    ${opts.manifestItems ?? ""}
  </manifest>
  <spine></spine>
</package>`;
}
