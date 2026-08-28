import { NextResponse } from "next/server";
import { getActiveProfile } from "@/lib/profiles/store";
import { deleteShelf, updateShelf } from "@/lib/shelves/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getActiveProfile();
  const body = (await request.json().catch(() => ({}))) as { name?: string; color?: string };

  const patch: Partial<{ name: string; color: string }> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.color === "string") patch.color = body.color;

  const shelf = await updateShelf(profile.id, id, patch);
  if (!shelf) {
    return NextResponse.json({ error: "Shelf not found" }, { status: 404 });
  }
  return NextResponse.json({ shelf });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getActiveProfile();
  await deleteShelf(profile.id, id);
  return NextResponse.json({ ok: true });
}
