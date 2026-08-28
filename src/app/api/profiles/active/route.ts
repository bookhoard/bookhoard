import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listProfiles } from "@/lib/profiles/store";
import { verifyPassword } from "@/lib/profiles/password";
import { PROFILE_COOKIE, toPublicProfile } from "@/lib/profiles/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    password?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const profiles = await listProfiles();
  const profile = profiles.find((p) => p.id === body.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.passwordHash) {
    if (!body.password || !verifyPassword(body.password, profile.passwordHash)) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }
  }

  const store = await cookies();
  store.set(PROFILE_COOKIE, profile.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return NextResponse.json({ profile: toPublicProfile(profile) });
}
