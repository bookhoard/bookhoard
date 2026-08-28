// Set on the public Cloudflare demo build only (see release.yml's
// "Build for Cloudflare" step) — never on self-hosted deployments.
// NEXT_PUBLIC_ so both server checks (blocking uploads) and client checks
// (hiding the upload UI) read the same build-time-inlined value.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
