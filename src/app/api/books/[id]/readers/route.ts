import { NextResponse } from "next/server";
import { getActiveProfile, listProfiles } from "@/lib/profiles/store";
import { getProfileState } from "@/lib/profiles/state";

export interface BookReader {
  profileId: string;
  name: string;
  color: string;
  read: boolean;
  progress?: number;
  rating?: number;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [profiles, active] = await Promise.all([listProfiles(), getActiveProfile()]);

  const readers: BookReader[] = [];
  await Promise.all(
    profiles
      .filter((p) => p.id !== active.id)
      .map(async (p) => {
        const state = await getProfileState(p.id);
        const entry = state[id];
        if (!entry) return;
        const touched = entry.read || entry.progress !== undefined || entry.rating !== undefined;
        if (!touched) return;
        readers.push({
          profileId: p.id,
          name: p.name,
          color: p.color,
          read: !!entry.read,
          progress: entry.progress,
          rating: entry.rating,
        });
      })
  );

  return NextResponse.json({ readers });
}
