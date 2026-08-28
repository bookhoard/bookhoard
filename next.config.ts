import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // The Cloudflare Workers build (opennextjs-cloudflare) does its own
  // bundling and doesn't want Next's standalone output; only apply it for
  // the Docker build, which sets this env var explicitly.
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
    ],
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
