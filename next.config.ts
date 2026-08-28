import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // The Cloudflare Workers build (opennextjs-cloudflare) does its own
  // bundling and doesn't want Next's standalone output; only apply it for
  // the Docker build, which sets this env var explicitly.
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  // The Cloudflare build never uses the S3 driver (STORAGE_DRIVER=r2), but
  // the AWS SDK is ~3.7MB and blows past the Workers script size limit if
  // it's bundled regardless — swap it for a stub so it's excluded entirely.
  turbopack: process.env.CLOUDFLARE_BUILD
    ? {
        resolveAlias: {
          "@aws-sdk/client-s3": "./src/lib/storage/aws-sdk-stub.ts",
          "@aws-sdk/s3-request-presigner": "./src/lib/storage/aws-sdk-stub.ts",
        },
      }
    : undefined,
  images: {
    // Next's built-in optimizer fetches same-origin images via Cloudflare's
    // static-assets binding, which only knows about prebuilt static files —
    // our covers are streamed dynamically from R2/S3 via /api/files/[...key],
    // so every cover 404s there. Serve them unoptimized on that build instead.
    unoptimized: !!process.env.CLOUDFLARE_BUILD,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
    ],
  },
};

export default nextConfig;

// Only wanted for `next dev` (proxies Cloudflare bindings locally) — calling
// this during `next build` tries to spawn the workerd binary, which crashes
// non-interactive/Docker builds where it isn't available.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
