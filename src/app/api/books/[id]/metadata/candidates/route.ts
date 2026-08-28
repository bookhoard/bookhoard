import { NextResponse } from "next/server";
import { readJson } from "@/lib/store";
import { lookupOpenLibraryCandidates } from "@/lib/metadata/openlibrary";
import { getSettings } from "@/lib/settings/store";
import type { BookRecord } from "@/lib/books/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const book = await readJson<BookRecord>(`books/${id}/metadata.json`);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const settings = await getSettings();
  const candidates = await lookupOpenLibraryCandidates(
    {
      isbn: book.isbn,
      title: book.title,
      author: book.author,
    },
    settings.metadataCandidateLimit
  );
  if (candidates.length === 0) {
    return NextResponse.json({ error: "No metadata found" }, { status: 404 });
  }

  return NextResponse.json({ candidates });
}
