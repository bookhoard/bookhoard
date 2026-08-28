import { NextResponse } from "next/server";
import { deleteProfile, getActiveProfile, getProfileById, updateProfile } from "@/lib/profiles/store";
import { hashPassword, verifyPassword } from "@/lib/profiles/password";
import { toPublicProfile, type ProfileRole } from "@/lib/profiles/types";

interface UpdateProfileBody {
  name?: string;
  color?: string;
  ereaderEmail?: string | null;
  role?: ProfileRole;
  currentPassword?: string;
  password?: string;
  removePassword?: boolean;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const active = await getActiveProfile();
  const isSelf = id === active.id;
  const isAdmin = active.role === "admin";

  if (!isSelf && !isAdmin) {
    return NextResponse.json(
      { error: "You can only edit your own profile" },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as UpdateProfileBody;

  const patch: Partial<{
    name: string;
    color: string;
    ereaderEmail?: string;
    passwordHash?: string;
    role: ProfileRole;
  }> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.color === "string") patch.color = body.color;
  if (body.ereaderEmail !== undefined) {
    patch.ereaderEmail = body.ereaderEmail?.trim() || undefined;
  }

  if (body.role !== undefined) {
    if (!isAdmin) {
      return NextResponse.json({ error: "Only an admin can change roles" }, { status: 403 });
    }
    patch.role = body.role === "admin" ? "admin" : "reader";
  }

  if (body.password || body.removePassword) {
    const existing = await getProfileById(id);
    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    // self always has to prove the current password; an admin resetting
    // someone else's forgotten password doesn't need to know it
    if (existing.passwordHash && isSelf) {
      if (!body.currentPassword || !verifyPassword(body.currentPassword, existing.passwordHash)) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
    }
    if (body.removePassword) {
      patch.passwordHash = undefined;
    } else if (body.password) {
      if (body.password.length < 4) {
        return NextResponse.json(
          { error: "Password must be at least 4 characters" },
          { status: 400 }
        );
      }
      patch.passwordHash = hashPassword(body.password);
    }
  }

  const profile = await updateProfile(id, patch);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json({ profile: toPublicProfile(profile) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const active = await getActiveProfile();
  if (active.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can delete profiles" },
      { status: 403 }
    );
  }

  const result = await deleteProfile(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
