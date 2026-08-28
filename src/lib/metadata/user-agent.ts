/**
 * Open Library asks that regular API callers identify themselves via
 * User-Agent (app name + contact) — identified requests get a 3x higher
 * rate limit (3 req/s vs 1 req/s for anonymous ones). See
 * https://openlibrary.org/dev/docs/api/covers and their API rate-limit docs.
 *
 * Rotating/randomizing the User-Agent would do the opposite of what we want
 * here: Open Library keys the higher limit off a *stable, identifiable*
 * value, so a random one is treated as anonymous (and looks like evasion).
 */
export function openLibraryUserAgent(): string {
  const contact = process.env.OPENLIBRARY_CONTACT?.trim();
  return contact
    ? `Bookhoard/0.1 (+https://bookhoard.dev; ${contact})`
    : "Bookhoard/0.1 (+https://bookhoard.dev)";
}
