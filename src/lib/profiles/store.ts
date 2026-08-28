import { cookies } from "next/headers";
import { mutateJson, readJson } from "@/lib/store";
import type { BookRecord } from "@/lib/books/types";
import { nextProfileColor, PROFILE_COOKIE, type Profile, type ProfileRole } from "./types";
import { setProfileState, type ProfileBookState, type ProfileState } from "./state";

const KEY = "profiles/index.json";

/** Pre-profiles installs kept rating/read/cfi/progress/lastReadAt directly on
 * the BookRecord; current ones never do. Loosely typed since this only
 * matters for reading data that predates the field's removal from the type. */
type LegacyBookRecord = BookRecord & Partial<ProfileBookState>;

/** Builds the very first profile from whatever per-book rating/read/progress
 * already lives on the shared index — so upgrading from the single-profile
 * era doesn't wipe anyone's reading history. */
async function migrateLegacyStateInto(profileId: string): Promise<void> {
  const books = (await readJson<LegacyBookRecord[]>("index.json")) ?? [];
  const state: ProfileState = {};
  for (const book of books) {
    const entry: ProfileBookState = {
      rating: book.rating,
      read: book.read,
      cfi: book.cfi,
      progress: book.progress,
      lastReadAt: book.lastReadAt,
    };
    if (Object.values(entry).some((v) => v !== undefined)) {
      state[book.id] = entry;
    }
  }
  if (Object.keys(state).length > 0) {
    await setProfileState(profileId, state);
  }
}

/** Profiles created before roles existed have no `role` field on disk —
 * treat them as admins so upgrading never locks an existing user out of
 * their own settings. */
function withRoleFallback(profiles: Profile[]): Profile[] {
  return profiles.map((p) => (p.role ? p : { ...p, role: "admin" as ProfileRole }));
}

/** Creates the default profile on first boot, migrating legacy state into it. Idempotent. */
export async function ensureProfiles(): Promise<Profile[]> {
  const existing = await readJson<Profile[]>(KEY);
  if (existing && existing.length > 0) return withRoleFallback(existing);

  const profile: Profile = {
    id: "default",
    name: "Profile 1",
    color: nextProfileColor(4),
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  await migrateLegacyStateInto(profile.id);
  return mutateJson<Profile[]>(KEY, (current) =>
    current && current.length > 0 ? current : [profile]
  );
}

export async function listProfiles(): Promise<Profile[]> {
  return ensureProfiles();
}

export async function createProfile(name: string, role: ProfileRole = "reader"): Promise<Profile> {
  const trimmed = name.trim() || "New Profile";
  const profiles = await mutateJson<Profile[]>(KEY, (current) => {
    const list = current ?? [];
    const profile: Profile = {
      id: crypto.randomUUID(),
      name: trimmed,
      color: nextProfileColor(list.length),
      role,
      createdAt: new Date().toISOString(),
    };
    return [...list, profile];
  });
  return profiles[profiles.length - 1];
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, "name" | "color" | "ereaderEmail" | "passwordHash" | "role">>
): Promise<Profile | null> {
  const profiles = await mutateJson<Profile[]>(KEY, (current) =>
    (current ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p))
  );
  return profiles.find((p) => p.id === id) ?? null;
}

/** Full profile, including the password hash — server-only, never send to the client. */
export async function getProfileById(id: string): Promise<Profile | null> {
  const profiles = await ensureProfiles();
  return profiles.find((p) => p.id === id) ?? null;
}

/** Refuses to delete the last remaining profile, or the last admin — there
 * must always be someone "watching" and someone who can manage the place. */
export async function deleteProfile(id: string): Promise<{ ok: boolean; error?: string }> {
  const current = withRoleFallback((await readJson<Profile[]>(KEY)) ?? []);
  if (current.length <= 1) {
    return { ok: false, error: "Can't delete the only profile" };
  }
  const target = current.find((p) => p.id === id);
  const remainingAdmins = current.filter((p) => p.id !== id && p.role === "admin");
  if (target?.role === "admin" && remainingAdmins.length === 0) {
    return { ok: false, error: "Can't delete the only admin" };
  }
  await mutateJson<Profile[]>(KEY, (list) => (list ?? []).filter((p) => p.id !== id));
  return { ok: true };
}

export async function getActiveProfile(): Promise<Profile> {
  const profiles = await ensureProfiles();
  const store = await cookies();
  const activeId = store.get(PROFILE_COOKIE)?.value;
  return profiles.find((p) => p.id === activeId) ?? profiles[0];
}
