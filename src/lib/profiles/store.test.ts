import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDriver } from "@/lib/storage/test-helpers";
import { PROFILE_COOKIE } from "./types";

const driver = createMemoryDriver();
vi.mock("@/lib/storage", () => ({
  getStorage: () => driver,
}));

let cookieValue: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === PROFILE_COOKIE && cookieValue ? { value: cookieValue } : undefined),
  }),
}));

const {
  ensureProfiles,
  listProfiles,
  createProfile,
  updateProfile,
  getProfileById,
  deleteProfile,
  getActiveProfile,
} = await import("./store");

beforeEach(() => {
  driver.files.clear();
  cookieValue = undefined;
});

describe("ensureProfiles", () => {
  it("creates a single admin profile on first boot", async () => {
    const profiles = await ensureProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({ id: "default", role: "admin" });
  });

  it("is idempotent — calling it again doesn't create a second profile", async () => {
    await ensureProfiles();
    const profiles = await ensureProfiles();
    expect(profiles).toHaveLength(1);
  });

  it("migrates legacy per-book state from index.json into the new default profile", async () => {
    await driver.put(
      "index.json",
      Buffer.from(
        JSON.stringify([
          { id: "book-1", rating: 5, read: true, contentHash: "h", title: "T", author: "A", size: 1, addedAt: "2024-01-01", hasCover: false },
          { id: "book-2", contentHash: "h2", title: "T2", author: "A2", size: 1, addedAt: "2024-01-01", hasCover: false },
        ])
      ),
      "application/json"
    );
    await ensureProfiles();
    const state = JSON.parse((await driver.files.get("profiles/default/state.json"))!.toString());
    expect(state["book-1"]).toMatchObject({ rating: 5, read: true });
    expect(state["book-2"]).toBeUndefined();
  });

  it("backfills role: admin for profiles created before roles existed", async () => {
    await driver.put(
      "profiles/index.json",
      Buffer.from(JSON.stringify([{ id: "old", name: "Old", color: "bg-blue-500", createdAt: "2024-01-01" }])),
      "application/json"
    );
    const profiles = await ensureProfiles();
    expect(profiles[0].role).toBe("admin");
  });
});

describe("createProfile / updateProfile / getProfileById", () => {
  it("creates a profile with a trimmed name and reader role by default", async () => {
    await ensureProfiles();
    const profile = await createProfile("  Kid  ");
    expect(profile.name).toBe("Kid");
    expect(profile.role).toBe("reader");
  });

  it("falls back to 'New Profile' when the name is blank", async () => {
    await ensureProfiles();
    const profile = await createProfile("   ");
    expect(profile.name).toBe("New Profile");
  });

  it("updateProfile patches only the given fields", async () => {
    await ensureProfiles();
    const created = await createProfile("Reader");
    const updated = await updateProfile(created.id, { name: "Renamed" });
    expect(updated?.name).toBe("Renamed");
    expect(updated?.role).toBe("reader");
  });

  it("updateProfile returns null for an unknown id", async () => {
    await ensureProfiles();
    expect(await updateProfile("nope", { name: "X" })).toBeNull();
  });

  it("getProfileById returns null for an unknown id", async () => {
    await ensureProfiles();
    expect(await getProfileById("nope")).toBeNull();
  });
});

describe("deleteProfile", () => {
  it("refuses to delete the only remaining profile", async () => {
    const [only] = await ensureProfiles();
    const result = await deleteProfile(only.id);
    expect(result).toEqual({ ok: false, error: "Can't delete the only profile" });
    expect(await listProfiles()).toHaveLength(1);
  });

  it("refuses to delete the last admin, even with other (reader) profiles present", async () => {
    const [admin] = await ensureProfiles();
    await createProfile("Reader", "reader");
    const result = await deleteProfile(admin.id);
    expect(result).toEqual({ ok: false, error: "Can't delete the only admin" });
  });

  it("allows deleting a non-admin profile when an admin remains", async () => {
    const [admin] = await ensureProfiles();
    const reader = await createProfile("Reader", "reader");
    const result = await deleteProfile(reader.id);
    expect(result).toEqual({ ok: true });
    const remaining = await listProfiles();
    expect(remaining.map((p) => p.id)).toEqual([admin.id]);
  });

  it("allows deleting an admin when another admin remains", async () => {
    const [firstAdmin] = await ensureProfiles();
    const secondAdmin = await createProfile("Co-admin", "admin");
    const result = await deleteProfile(firstAdmin.id);
    expect(result).toEqual({ ok: true });
    const remaining = await listProfiles();
    expect(remaining.map((p) => p.id)).toEqual([secondAdmin.id]);
  });
});

describe("getActiveProfile", () => {
  it("falls back to the first profile when there is no cookie", async () => {
    const [first] = await ensureProfiles();
    expect((await getActiveProfile()).id).toBe(first.id);
  });

  it("falls back to the first profile when the cookie names an unknown profile", async () => {
    const [first] = await ensureProfiles();
    cookieValue = "does-not-exist";
    expect((await getActiveProfile()).id).toBe(first.id);
  });

  it("resolves the profile named by the cookie", async () => {
    await ensureProfiles();
    const second = await createProfile("Second");
    cookieValue = second.id;
    expect((await getActiveProfile()).id).toBe(second.id);
  });
});
