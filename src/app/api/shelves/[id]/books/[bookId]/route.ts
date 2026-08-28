import { NextResponse } from "next/server";
import { getActiveProfile } from "@/lib/profiles/store";
import { removeBookFromShelf } from "@/lib/shelves/store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; bookId: string }> }
) {
  const { id, bookId } = await params;
  const profile = await getActiveProfile();
  const shelves = await removeBookFromShelf(profile.id, id, bookId);
  return NextResponse.json({ shelves });
}
