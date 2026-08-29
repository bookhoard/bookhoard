<p align="center">
  <img src="public/logo.png" alt="Bookhoarder" width="120" />
</p>

<h1 align="center">Bookhoarder</h1>

<p align="center">
  Self-hosted EPUB library. Object storage is the only persistence layer —
  no database, no volumes, no migrations.
</p>

<p align="center">
  <a href="https://github.com/bookhoard/bookhoarder/actions/workflows/ci.yml"><img src="https://github.com/bookhoard/bookhoarder/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/bookhoard/bookhoarder/releases"><img src="https://img.shields.io/github/v/release/bookhoard/bookhoarder" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Elastic--2.0-blue" alt="License"></a>
  <a href="https://bookhoarder.dev"><img src="https://img.shields.io/badge/website-bookhoarder.dev-orange" alt="Website"></a>
  <a href="https://docs.bookhoarder.dev"><img src="https://img.shields.io/badge/docs-docs.bookhoarder.dev-blue" alt="Documentation"></a>
</p>

## Quickstart (Docker)

```bash
docker compose up
```

This starts the app plus a local MinIO instance (the S3-compatible bucket)
and creates the `bookhoard` bucket automatically. Open http://localhost:3000.

## Local development

```bash
pnpm install
cp .env.example .env.local   # defaults to the local filesystem driver
pnpm dev
```

Open http://localhost:3000.

To develop against S3/MinIO instead of the local driver, run `docker compose up minio minio-init`
and set `STORAGE_DRIVER=s3` in `.env.local` (see `.env.example` for the rest of the S3 vars).

## Documentation

Full docs are at [docs.bookhoarder.dev](https://docs.bookhoarder.dev) (source: [bookhoard/docs](https://github.com/bookhoard/docs)).

## Features

- EPUB upload, ingest, and an in-browser reader (epub.js) with per-profile
  reading progress, ratings, and shelves
- Multi-profile support (admin/reader roles) with optional per-profile
  passwords
- Metadata lookup and cover fetching via Open Library, with manual editing
- Trending books, full-text library search, and send-to-e-reader over SMTP
- OPDS catalog feed (`/opds`) for browsing and downloading straight from any
  OPDS-compatible e-reader app — the URL is in Settings → E-Reader Email
- Pluggable storage driver: local filesystem or S3-compatible object storage,
  including a configurable directory prefix for sharing a bucket with other
  apps (see `docker-compose.yml` for a MinIO-backed setup)

## License

Bookhoarder is licensed under the [Elastic License 2.0](LICENSE). You're free
to self-host, modify, and use it — including internally at a company — but
you may not offer it to third parties as a hosted or managed service.

