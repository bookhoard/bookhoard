import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_MODE } from "@/lib/demo-mode";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Only sets a cookie — no bucket writes — so it's safe to allow even in the
// read-only demo. Lets visitors still switch between the seeded profiles.
const ALLOWED_MUTATIONS = new Set(["/api/profiles/active"]);

/**
 * The public Cloudflare demo is read-only — blocking every mutating request
 * here (rather than per-route) means a new API route can't accidentally
 * ship without this check, and there's no data to reset/restore in the
 * first place.
 */
export function middleware(request: NextRequest) {
  const isMutation = !SAFE_METHODS.has(request.method);
  const isAllowed = ALLOWED_MUTATIONS.has(request.nextUrl.pathname);

  if (DEMO_MODE && isMutation && !isAllowed) {
    return NextResponse.json(
      { error: "This is a read-only demo — uploads, deletes, and settings changes are disabled." },
      { status: 403 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
