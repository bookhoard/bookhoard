import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { mutateJson, readJson } from "@/lib/store";
import { openLibraryUserAgent } from "@/lib/metadata/user-agent";
import type { BookRecord } from "@/lib/books/types";

interface ApplyMetadataBody {
  title?: string;
  author?: string;
  description?: string;
  coverUrl?: string;
}

const MAX_TAGS = 30;
const MAX_TAG_LENGTH = 40;

/** Trims, drops blanks, dedupes case-insensitively (keeping first-seen casing), and caps count/length. */
function normalizeTags(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim().slice(0, MAX_TAG_LENGTH);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(trimmed);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

function parseTagsField(value: FormDataEntryValue | null): string[] | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return normalizeTags(JSON.parse(value));
  } catch {
    return undefined;
  }
}

function parseSeries(
  name: FormDataEntryValue | null,
  position: FormDataEntryValue | null
): BookRecord["series"] | null | undefined {
  if (typeof name !== "string") return undefined;
  const trimmedName = name.trim();
  if (!trimmedName) return null;
  const parsedPosition = typeof position === "string" ? Number(position) : NaN;
  return {
    name: trimmedName,
    position: Number.isFinite(parsedPosition) && parsedPosition >= 0 ? parsedPosition : 0,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const book = await readJson<BookRecord>(`books/${id}/metadata.json`);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const storage = getStorage();
  const contentType = request.headers.get("content-type") ?? "";

  let title: string | undefined;
  let author: string | undefined;
  let description: string | undefined;
  let coverBuffer: Buffer | undefined;
  let coverContentType: string | undefined;
  let tags: string[] | undefined;
  let series: BookRecord["series"] | null | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    title = typeof form.get("title") === "string" ? (form.get("title") as string) : undefined;
    author = typeof form.get("author") === "string" ? (form.get("author") as string) : undefined;
    description =
      typeof form.get("description") === "string" ? (form.get("description") as string) : undefined;
    tags = parseTagsField(form.get("tags"));
    series = parseSeries(form.get("seriesName"), form.get("seriesPosition"));

    const cover = form.get("cover");
    if (cover instanceof File) {
      if (!cover.type.startsWith("image/")) {
        return NextResponse.json({ error: "Cover must be an image file" }, { status: 400 });
      }
      coverBuffer = Buffer.from(await cover.arrayBuffer());
      coverContentType = cover.type;
    }
  } else {
    const body = (await request.json().catch(() => ({}))) as ApplyMetadataBody;
    title = body.title;
    author = body.author;
    description = body.description;

    if (body.coverUrl) {
      const imageRes = await fetch(body.coverUrl, {
        headers: { "User-Agent": openLibraryUserAgent() },
      });
      if (!imageRes.ok) {
        return NextResponse.json({ error: "Failed to download cover" }, { status: 502 });
      }
      coverBuffer = Buffer.from(await imageRes.arrayBuffer());
      coverContentType = imageRes.headers.get("content-type") ?? "image/jpeg";
    }
  }

  let hasCover = book.hasCover;
  let coverExt = book.coverExt;
  let coverUpdatedAt = book.coverUpdatedAt;

  if (coverBuffer) {
    const ext = (coverContentType ?? "image/jpeg").split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    await storage.put(`books/${id}/cover.${ext}`, coverBuffer, coverContentType ?? "image/jpeg");
    hasCover = true;
    coverExt = ext;
    coverUpdatedAt = new Date().toISOString();
  }

  const updated: BookRecord = {
    ...book,
    title: title || book.title,
    author: author || book.author,
    description: description ?? book.description,
    hasCover,
    coverExt,
    coverUpdatedAt,
    tags: tags ?? book.tags,
    series: series === null ? undefined : (series ?? book.series),
  };

  await storage.put(
    `books/${id}/metadata.json`,
    Buffer.from(JSON.stringify(updated, null, 2), "utf-8"),
    "application/json"
  );

  await mutateJson<BookRecord[]>("index.json", (current) =>
    (current ?? []).map((b) => (b.id === id ? updated : b))
  );

  return NextResponse.json({ book: updated });
}
