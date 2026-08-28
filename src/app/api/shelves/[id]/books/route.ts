import { NextResponse } from "next/server";
import { getActiveProfile } from "@/lib/profiles/store";
import { addBookToShelf } from "@/lib/shelves/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getActiveProfile();
  const body = (await request.json().catch(() => ({}))) as { bookId?: string };
  if (!body.bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }
  const shelves = await addBookToShelf(profile.id, id, body.bookId);
  return NextResponse.json({ shelves });
}
