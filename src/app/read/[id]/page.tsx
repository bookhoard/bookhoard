import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readJson } from "@/lib/store";
import type { BookRecord } from "@/lib/books/types";
import { getActiveProfile } from "@/lib/profiles/store";
import { applyProfileState, getProfileState } from "@/lib/profiles/state";
import { EpubReader } from "@/components/reader/epub-reader";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const record = await readJson<BookRecord>(`books/${id}/metadata.json`);
  return { title: record ? `${record.title} - Bookhoarder` : "Bookhoarder" };
}

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ toc?: string }>;
}) {
  const { id } = await params;
  const { toc } = await searchParams;

  const record = await readJson<BookRecord>(`books/${id}/metadata.json`);
  if (!record) notFound();

  const profile = await getActiveProfile();
  const state = await getProfileState(profile.id);
  const book = applyProfileState(record, state[id]);

  return <EpubReader book={book} initialTocOpen={toc === "1"} />;
}
