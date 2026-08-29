import { NextResponse } from "next/server";
import { buildNavigationFeed, NAVIGATION_TYPE } from "@/lib/opds/atom";

export const dynamic = "force-dynamic";

export async function GET() {
  const xml = buildNavigationFeed({
    id: "urn:bookhoarder:root",
    title: "Bookhoarder",
    selfHref: "/opds",
    entries: [
      {
        id: "urn:bookhoarder:all",
        title: "All Books",
        summary: "Your full library",
        href: "/opds/all",
      },
    ],
  });
  return new NextResponse(xml, { headers: { "Content-Type": NAVIGATION_TYPE } });
}
