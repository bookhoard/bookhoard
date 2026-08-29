import { NextResponse } from "next/server";
import { readJson } from "@/lib/store";
import { buildAcquisitionFeed, ACQUISITION_TYPE } from "@/lib/opds/atom";
import type { BookRecord } from "@/lib/books/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const index = (await readJson<BookRecord[]>("index.json")) ?? [];
  const matches = q
    ? index.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      )
    : [];
  const sorted = matches.sort((a, b) => a.title.localeCompare(b.title));
  const start = (page - 1) * PAGE_SIZE;
  const books = sorted.slice(start, start + PAGE_SIZE);

  const qParam = encodeURIComponent(searchParams.get("q") ?? "");
  const xml = buildAcquisitionFeed({
    id: "urn:bookhoarder:search",
    title: `Search: ${q}`,
    selfHref: `/opds/search?q=${qParam}&page=${page}`,
    books,
    page,
    pageSize: PAGE_SIZE,
    totalCount: sorted.length,
  });
  return new NextResponse(xml, { headers: { "Content-Type": ACQUISITION_TYPE } });
}
