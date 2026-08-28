export type ProfileRole = "admin" | "reader";

export interface Profile {
  id: string;
  name: string;
  color: string;
  ereaderEmail?: string;
  /** salt:hash — never sent to the client, see PublicProfile */
  passwordHash?: string;
  /** admins can create/delete profiles, assign roles, and edit server-wide
   * settings; readers can only edit their own profile. The very first
   * profile is always an admin so there's never a locked-out install. */
  role: ProfileRole;
  createdAt: string;
}

/** Shape the client is allowed to see — passwordHash stripped down to a flag. */
export type PublicProfile = Omit<Profile, "passwordHash"> & { hasPassword: boolean };

export function toPublicProfile(profile: Profile): PublicProfile {
  const { passwordHash, ...rest } = profile;
  return { ...rest, hasPassword: !!passwordHash };
}

export const PROFILE_COLORS = [
  "bg-blue-500",
  "bg-fuchsia-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-orange-500",
];

export function nextProfileColor(existingCount: number): string {
  return PROFILE_COLORS[existingCount % PROFILE_COLORS.length];
}

export const PROFILE_COOKIE = "bookhoard_profile";
