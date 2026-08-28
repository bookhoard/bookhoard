import { getStorage } from "@/lib/storage";

/**
 * All bucket JSON mutations go through this module. Two handlers doing a
 * concurrent read-modify-write on the same key would otherwise silently
 * drop one — every key gets its own FIFO queue instead.
 */
const queues = new Map<string, Promise<unknown>>();

function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const prev = queues.get(key) ?? Promise.resolve();
  const run = prev.then(task, task);
  // the queue tail must never reject, or every later write on this key
  // would be skipped
  queues.set(
    key,
    run.then(
      () => undefined,
      () => undefined
    )
  );
  return run;
}

export async function readJson<T>(key: string): Promise<T | null> {
  const storage = getStorage();
  if (!(await storage.exists(key))) return null;

  const stream = await storage.get(key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf-8")) as T;
}

async function writeJsonNow<T>(key: string, data: T): Promise<void> {
  const storage = getStorage();
  const body = Buffer.from(JSON.stringify(data, null, 2), "utf-8");
  await storage.put(key, body, "application/json");
}

/** Serialized read-modify-write. Use for rare writes (index.json, library.json). */
export function mutateJson<T>(
  key: string,
  mutator: (current: T | null) => T
): Promise<T> {
  return enqueue(key, async () => {
    const current = await readJson<T>(key);
    const next = mutator(current);
    await writeJsonNow(key, next);
    return next;
  });
}

interface PendingDebounce {
  timer: ReturnType<typeof setTimeout>;
  mutator: (current: unknown) => unknown;
}
const debounced = new Map<string, PendingDebounce>();

/**
 * Coalesces frequent writes to the same key (progress.json) into one write
 * every `debounceMs`. Only the latest mutator per key survives; it always
 * runs against the true current state when the timer fires.
 */
export function mutateJsonDebounced<T>(
  key: string,
  mutator: (current: T | null) => T,
  debounceMs = 10_000
): void {
  const existing = debounced.get(key);
  if (existing) clearTimeout(existing.timer);

  const timer = setTimeout(() => {
    debounced.delete(key);
    void mutateJson(key, mutator);
  }, debounceMs);
  timer.unref?.();

  debounced.set(key, {
    timer,
    mutator: mutator as (current: unknown) => unknown,
  });
}

/** Flushes every pending debounced write immediately. Call on SIGTERM. */
export async function flushPendingWrites(): Promise<void> {
  const keys = Array.from(debounced.keys());
  await Promise.all(
    keys.map((key) => {
      const pending = debounced.get(key);
      if (!pending) return Promise.resolve();
      clearTimeout(pending.timer);
      debounced.delete(key);
      return mutateJson(key, pending.mutator);
    })
  );
}

declare global {
  var __bookhoardShutdownHookRegistered: boolean | undefined;
}

if (typeof process !== "undefined" && !globalThis.__bookhoardShutdownHookRegistered) {
  globalThis.__bookhoardShutdownHookRegistered = true;
  process.once("SIGTERM", () => {
    flushPendingWrites().finally(() => process.exit(0));
  });
}
