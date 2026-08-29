import type { MetadataRoute } from "next";
import { DEMO_MODE } from "@/lib/demo-mode";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookhoarder.dev";

/**
 * Mirrors robots.ts: a self-hosted instance is someone's private library
 * and is already disallowed from crawling, so there's nothing worth listing
 * here. Only the public demo publishes a sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!DEMO_MODE) return [];

  const routes = ["/", "/trending", "/reading-now"];
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
  }));
}
