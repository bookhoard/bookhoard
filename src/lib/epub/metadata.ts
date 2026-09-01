import { unzipSync, strFromU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";

export interface EpubMetadata {
  title: string;
  author: string;
  language?: string;
  isbn?: string;
  opfPath: string;
  manifest: Record<string, { href: string; mediaType: string; properties?: string }>;
  opfDir: string;
  coverId?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
});

function firstText(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return firstText(value[0]);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // fast-xml-parser auto-converts purely-numeric text (e.g. an ISBN-13)
    // into a JS number, not a string — coerce instead of dropping it.
    const text = obj["#text"];
    return text === undefined || text === null ? undefined : String(text);
  }
  return String(value);
}

function dirname(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? "" : path.slice(0, idx + 1);
}

/**
 * Unzips just enough of the EPUB to read title/author/language/isbn from the
 * OPF package document, plus the manifest (used separately for cover lookup).
 */
export function parseEpubMetadata(buffer: Buffer): EpubMetadata {
  const files = unzipSync(new Uint8Array(buffer), {
    filter: (file) =>
      file.name === "META-INF/container.xml" || file.name.endsWith(".opf"),
  });

  const containerXml = files["META-INF/container.xml"];
  if (!containerXml) {
    throw new Error("Not a valid EPUB: missing META-INF/container.xml");
  }
  const container = parser.parse(strFromU8(containerXml));
  const opfPath: string | undefined =
    container?.container?.rootfiles?.rootfile?.["@_full-path"];
  if (!opfPath) {
    throw new Error("Not a valid EPUB: no rootfile in container.xml");
  }

  const opfXml = files[opfPath];
  if (!opfXml) {
    throw new Error(`Not a valid EPUB: OPF file ${opfPath} not found`);
  }
  const opf = parser.parse(strFromU8(opfXml));
  const pkg = opf?.package ?? {};
  const metadata = pkg.metadata ?? {};

  const title = firstText(metadata.title) ?? "Untitled";
  const author = firstText(metadata.creator) ?? "Unknown";
  const language = firstText(metadata.language);

  const identifiers = Array.isArray(metadata.identifier)
    ? metadata.identifier
    : metadata.identifier
      ? [metadata.identifier]
      : [];
  const isbnEntry = identifiers.find((entry: Record<string, unknown>) => {
    const scheme = entry?.["@_scheme"];
    return typeof scheme === "string" && scheme.toUpperCase() === "ISBN";
  });
  const isbn = isbnEntry ? firstText(isbnEntry) : undefined;

  const manifestItems = Array.isArray(pkg.manifest?.item)
    ? pkg.manifest.item
    : pkg.manifest?.item
      ? [pkg.manifest.item]
      : [];
  const manifest: EpubMetadata["manifest"] = {};
  for (const item of manifestItems) {
    const id = item?.["@_id"];
    const href = item?.["@_href"];
    const mediaType = item?.["@_media-type"];
    if (id && href && mediaType) {
      manifest[id] = { href, mediaType, properties: item?.["@_properties"] };
    }
  }

  const metaItems = Array.isArray(metadata.meta) ? metadata.meta : metadata.meta ? [metadata.meta] : [];
  const coverMeta = metaItems.find(
    (m: Record<string, unknown>) => m?.["@_name"] === "cover"
  );
  const coverIdFromMeta = coverMeta?.["@_content"] as string | undefined;
  const coverIdFromProperties = Object.keys(manifest).find(
    (id) => manifest[id].properties?.split(" ").includes("cover-image")
  );

  return {
    title,
    author,
    language,
    isbn,
    opfPath,
    manifest,
    opfDir: dirname(opfPath),
    coverId: coverIdFromProperties ?? coverIdFromMeta,
  };
}
