import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { mutateJson, readJson } from "@/lib/store";
import { getActiveProfile, listProfiles } from "@/lib/profiles/store";
import {
  applyProfileState,
  deleteProfileBookState,
  updateProfileBookState,
  type ProfileBookState,
} from "@/lib/profiles/state";
import type { BookRecord } from "@/lib/books/types";

interface UpdateBookBody {
  rating?: number;
  read?: boolean;
  cfi?: string;
  progress?: number;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const book = await readJson<BookRecord>(`books/${id}/metadata.json`);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateBookBody;

  const patch: Partial<ProfileBookState> = {};
  if (body.rating !== undefined) {
    if (
      typeof body.rating !== "number" ||
      !Number.isInteger(body.rating) ||
      body.rating < 0 ||
      body.rating > 5
    ) {
      return NextResponse.json({ error: "rating must be an integer 0-5" }, { status: 400 });
    }
    patch.rating = body.rating === 0 ? undefined : body.rating;
  }
  if (body.read !== undefined) {
    patch.read = !!body.read;
  }
  if (typeof body.cfi === "string") {
    patch.cfi = body.cfi;
    patch.lastReadAt = new Date().toISOString();
  }
  if (typeof body.progress === "number") {
    patch.progress = Math.min(100, Math.max(0, Math.round(body.progress)));
  }

  const profile = await getActiveProfile();
  const state = await updateProfileBookState(profile.id, id, patch);

  return NextResponse.json({ book: applyProfileState(book, state) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const activeProfile = await getActiveProfile();
  if (activeProfile.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can delete books" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const book = await readJson<BookRecord>(`books/${id}/metadata.json`);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const storage = getStorage();
  const keys = await storage.list(`books/${id}/`);
  await Promise.all(keys.map((key) => storage.delete(key)));

  await mutateJson<BookRecord[]>("index.json", (current) =>
    (current ?? []).filter((b) => b.id !== id)
  );

  const profiles = await listProfiles();
  await Promise.all(profiles.map((p) => deleteProfileBookState(p.id, id)));

  return NextResponse.json({ ok: true });
}
