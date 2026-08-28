import { NextResponse } from "next/server";
import { getActiveProfile } from "@/lib/profiles/store";
import { createShelf, listShelves } from "@/lib/shelves/store";

export async function GET() {
  const profile = await getActiveProfile();
  const shelves = await listShelves(profile.id);
  return NextResponse.json({ shelves });
}

export async function POST(request: Request) {
  const profile = await getActiveProfile();
  const body = (await request.json().catch(() => ({}))) as { name?: string; color?: string };
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const shelf = await createShelf(profile.id, body.name, body.color);
  return NextResponse.json({ shelf }, { status: 201 });
}
