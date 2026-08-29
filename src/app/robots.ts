import type { MetadataRoute } from "next";
import { DEMO_MODE } from "@/lib/demo-mode";

/**
 * A self-hosted instance is someone's private library — search engines
 * indexing it would expose their reading activity, so crawling is disabled
 * by default. The public demo is the one deployment meant to be discovered,
 * so it opts back in.
 */
export default function robots(): MetadataRoute.Robots {
  if (DEMO_MODE) {
    return { rules: { userAgent: "*", allow: "/" } };
  }
  return { rules: { userAgent: "*", disallow: "/" } };
}
