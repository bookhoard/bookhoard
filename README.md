# Bookhoard

Self-hosted EPUB library. Object storage is the only persistence layer — no
database, no volumes, no migrations.

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

## Features

- EPUB upload, ingest, and an in-browser reader (epub.js) with per-profile
  reading progress, ratings, and shelves
- Multi-profile support (admin/reader roles) with optional per-profile
  passwords
- Metadata lookup and cover fetching via Open Library, with manual editing
- Trending books, full-text library search, and send-to-e-reader over SMTP
- Pluggable storage driver: local filesystem or S3-compatible object storage
  (see `docker-compose.yml` for a MinIO-backed setup)

## License

Bookhoard is licensed under the [Elastic License 2.0](LICENSE). You're free
to self-host, modify, and use it — including internally at a company — but
you may not offer it to third parties as a hosted or managed service.
