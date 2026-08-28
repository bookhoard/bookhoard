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

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    title = typeof form.get("title") === "string" ? (form.get("title") as string) : undefined;
    author = typeof form.get("author") === "string" ? (form.get("author") as string) : undefined;
    description =
      typeof form.get("description") === "string" ? (form.get("description") as string) : undefined;

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
