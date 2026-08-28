import { NextResponse } from "next/server";
import { fetchOpenLibraryDescription } from "@/lib/metadata/openlibrary";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  const description = await fetchOpenLibraryDescription(key);
  return NextResponse.json({ description: description ?? null });
}
