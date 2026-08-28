// @ts-expect-error `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";

/** DEMO_RESET_URL/SECRET are set via `wrangler secret put` in the demo repo's
 * deploy step — they're not part of the app's own env vars, so they're not
 * in the generated CloudflareEnv interface. */
interface DemoEnv extends CloudflareEnv {
  DEMO_RESET_URL?: string;
  DEMO_RESET_SECRET?: string;
}

/**
 * Wraps the OpenNext-generated fetch handler and adds the hourly reset cron
 * (see wrangler.jsonc's `triggers.crons`). The actual wipe-and-reseed logic
 * lives behind /api/demo/reset — this just fires it on schedule.
 */
export default {
  fetch: handler.fetch,

  async scheduled(_event, env, ctx) {
    const url = env.DEMO_RESET_URL;
    const secret = env.DEMO_RESET_SECRET;
    if (!url || !secret) {
      console.error("Scheduled reset skipped: DEMO_RESET_URL/DEMO_RESET_SECRET not configured");
      return;
    }
    ctx.waitUntil(
      fetch(url, { method: "POST", headers: { Authorization: `Bearer ${secret}` } }).then((res) => {
        if (!res.ok) console.error(`Demo reset failed: ${res.status} ${res.statusText}`);
      })
    );
  },
} satisfies ExportedHandler<DemoEnv>;
