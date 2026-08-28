import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { mutateJson, readJson } from "@/lib/store";
import { parseEpubMetadata } from "@/lib/epub/metadata";
import { extractEpubCover } from "@/lib/epub/cover";
import { extractAllEpubFiles } from "@/lib/epub/extract";
import { slugify } from "@/lib/books/slug";
import { contentTypeFor } from "@/lib/content-type";
import type { BookRecord } from "@/lib/books/types";

export async function GET() {
  const index = (await readJson<BookRecord[]>("index.json")) ?? [];
  return NextResponse.json({ books: index });
}

function uniqueSlug(baseSlug: string, contentHash: string, taken: Set<string>): string {
  if (!taken.has(baseSlug)) return baseSlug;
  const withSuffix = `${baseSlug}-${contentHash.slice(0, 6)}`;
  if (!taken.has(withSuffix)) return withSuffix;
  let n = 2;
  while (taken.has(`${withSuffix}-${n}`)) n++;
  return `${withSuffix}-${n}`;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".epub")) {
    return NextResponse.json({ error: "Only .epub files are supported" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentHash = createHash("sha256").update(buffer).digest("hex");
  const storage = getStorage();

  const index = (await readJson<BookRecord[]>("index.json")) ?? [];
  const existing = index.find((b) => b.contentHash === contentHash);
  if (existing) {
    return NextResponse.json({ book: existing, duplicate: true });
  }

  let metadata;
  try {
    metadata = parseEpubMetadata(buffer);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }

  const id = uniqueSlug(
    slugify(metadata.title),
    contentHash,
    new Set(index.map((b) => b.id))
  );

  const cover = extractEpubCover(buffer, metadata);

  await storage.put(`books/${id}/book.epub`, buffer, "application/epub+zip");
  if (cover) {
    await storage.put(`books/${id}/cover.${cover.extension}`, cover.data, cover.contentType);
  }

  // epub.js's archived-URL mode (feeding it the raw .epub) never reliably
  // resolves book.opened, so the reader needs the archive unpacked and
  // served as plain files, opened via the OPF instead of the zip.
  const files = extractAllEpubFiles(buffer);
  await Promise.all(
    Object.entries(files)
      .filter(([path, data]) => !path.endsWith("/") && data.length > 0)
      .map(([path, data]) =>
        storage.put(`books/${id}/content/${path}`, Buffer.from(data), contentTypeFor(path))
      )
  );

  const book: BookRecord = {
    id,
    contentHash,
    title: metadata.title,
    author: metadata.author,
    isbn: metadata.isbn,
    lang: metadata.language,
    size: buffer.length,
    addedAt: new Date().toISOString(),
    hasCover: !!cover,
    coverExt: cover?.extension,
    coverUpdatedAt: cover ? new Date().toISOString() : undefined,
    opfPath: metadata.opfPath,
  };

  await storage.put(
    `books/${id}/metadata.json`,
    Buffer.from(JSON.stringify(book, null, 2), "utf-8"),
    "application/json"
  );

  await mutateJson<BookRecord[]>("index.json", (current) => {
    const list = current ?? [];
    return [...list.filter((b) => b.id !== id), book];
  });

  return NextResponse.json({ book, duplicate: false }, { status: 201 });
}
