import { describe, expect, it } from "vitest";
import { nextProfileColor, PROFILE_COLORS, toPublicProfile, type Profile } from "./types";

describe("nextProfileColor", () => {
  it("cycles through the palette and wraps around", () => {
    expect(nextProfileColor(0)).toBe(PROFILE_COLORS[0]);
    expect(nextProfileColor(PROFILE_COLORS.length)).toBe(PROFILE_COLORS[0]);
  });
});

describe("toPublicProfile", () => {
  it("strips the password hash and exposes only hasPassword", () => {
    const profile: Profile = {
      id: "1",
      name: "Reader",
      color: "bg-blue-500",
      role: "admin",
      createdAt: "2024-01-01T00:00:00.000Z",
      passwordHash: "salt:hash",
    };
    const pub = toPublicProfile(profile);
    expect(pub).not.toHaveProperty("passwordHash");
    expect(pub.hasPassword).toBe(true);
    expect(pub.name).toBe("Reader");
  });

  it("reports hasPassword false when there is no password set", () => {
    const profile: Profile = {
      id: "1",
      name: "Reader",
      color: "bg-blue-500",
      role: "reader",
      createdAt: "2024-01-01T00:00:00.000Z",
    };
    expect(toPublicProfile(profile).hasPassword).toBe(false);
  });
});
