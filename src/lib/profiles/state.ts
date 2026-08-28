import { mutateJson, readJson } from "@/lib/store";
import { bookCoverUrl, type Book, type BookRecord } from "@/lib/books/types";

/** Per-profile reading state for one book — rating, progress, shelf membership stay out of the shared BookRecord. */
export interface ProfileBookState {
  rating?: number;
  read?: boolean;
  cfi?: string;
  progress?: number;
  lastReadAt?: string;
}

export type ProfileState = Record<string, ProfileBookState>;

function stateKey(profileId: string): string {
  return `profiles/${profileId}/state.json`;
}

export async function getProfileState(profileId: string): Promise<ProfileState> {
  return (await readJson<ProfileState>(stateKey(profileId))) ?? {};
}

export async function setProfileState(profileId: string, state: ProfileState): Promise<void> {
  await mutateJson<ProfileState>(stateKey(profileId), () => state);
}

export async function updateProfileBookState(
  profileId: string,
  bookId: string,
  patch: Partial<ProfileBookState>
): Promise<ProfileBookState> {
  const next = await mutateJson<ProfileState>(stateKey(profileId), (current) => {
    const state = current ?? {};
    const existing = state[bookId] ?? {};
    return { ...state, [bookId]: { ...existing, ...patch } };
  });
  return next[bookId] ?? {};
}

export async function deleteProfileBookState(profileId: string, bookId: string): Promise<void> {
  await mutateJson<ProfileState>(stateKey(profileId), (current) => {
    if (!current || !(bookId in current)) return current ?? {};
    const rest = { ...current };
    delete rest[bookId];
    return rest;
  });
}

export function applyProfileState(record: BookRecord, state?: ProfileBookState): Book {
  return {
    ...record,
    rating: state?.rating,
    read: !!state?.read,
    cfi: state?.cfi,
    progress: state?.progress,
    lastReadAt: state?.lastReadAt,
    coverUrl: bookCoverUrl(record),
  };
}
