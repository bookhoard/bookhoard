# Bookhoarder

Self-hosted EPUB library. See `plans/first.md` for the full build plan.

## UI work
Before building or changing any screen, look at the reference images in `plans/`.
Match layout, spacing, and visual tone. Ask before deviating.

## Testing
Write tests for new features and changes whenever practical — don't leave
changes untested by default. If a suitable test setup doesn't exist yet for
the code you're touching, add one instead of skipping tests.

Unit tests use Vitest (`pnpm test`, or `pnpm test:watch`). Colocate a new
test as `<file>.test.ts` next to the source file. Data-layer modules under
`src/lib` (profiles/shelves/settings/store, backup export) are tested with
an in-memory `StorageDriver` from `src/lib/storage/test-helpers.ts` mocked
in for `@/lib/storage` — reuse it instead of hitting real storage. EPUB
fixtures for `src/lib/epub` tests are built in-memory with
`src/lib/epub/test-helpers.ts` rather than committed binary files. React
hooks run under `// @vitest-environment jsdom`; note that this Node/jsdom
combo needs the `localStorage` global polyfilled manually in tests (see
`src/hooks/use-book-sort.test.ts`) rather than relying on jsdom's own.

## Documentation
User-facing docs live in a separate repo: https://github.com/bookhoard/docs
(published at docs.bookhoarder.dev). When you ship a new feature or change
user-visible behavior, update the docs repo too — don't leave it to drift
out of sync with what the app actually does.
