import { NextResponse } from "next/server";
import { createProfile, getActiveProfile, listProfiles } from "@/lib/profiles/store";
import { toPublicProfile, type ProfileRole } from "@/lib/profiles/types";

export async function GET() {
  const profiles = await listProfiles();
  return NextResponse.json({ profiles: profiles.map(toPublicProfile) });
}

export async function POST(request: Request) {
  const active = await getActiveProfile();
  if (active.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can create profiles" },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    role?: ProfileRole;
  };
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const role: ProfileRole = body.role === "admin" ? "admin" : "reader";
  const profile = await createProfile(body.name, role);
  return NextResponse.json({ profile: toPublicProfile(profile) }, { status: 201 });
}
