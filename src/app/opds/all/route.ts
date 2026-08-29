import { NextResponse } from "next/server";
import { readJson } from "@/lib/store";
import { buildAcquisitionFeed, ACQUISITION_TYPE } from "@/lib/opds/atom";
import type { BookRecord } from "@/lib/books/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const index = (await readJson<BookRecord[]>("index.json")) ?? [];
  const sorted = [...index].sort((a, b) => a.title.localeCompare(b.title));
  const start = (page - 1) * PAGE_SIZE;
  const books = sorted.slice(start, start + PAGE_SIZE);

  const xml = buildAcquisitionFeed({
    id: "urn:bookhoarder:all",
    title: "All Books",
    selfHref: `/opds/all?page=${page}`,
    books,
    page,
    pageSize: PAGE_SIZE,
    totalCount: sorted.length,
  });
  return new NextResponse(xml, { headers: { "Content-Type": ACQUISITION_TYPE } });
}
