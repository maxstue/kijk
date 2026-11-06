# Railway tracing

Tracing is configured for project `kijk` (`1f0c34f3-19de-493a-8cb6-e9a33aea2845`),
environment `production` (`ca7bd6b1-afbd-4569-86f8-18ae1af5eb93`). Other environments
are unchanged. SDK instrumentation requires OBI to remain disabled.

Railway supplies `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL`,
`OTEL_EXPORTER_OTLP_HEADERS`, `OTEL_SERVICE_NAME` and `OTEL_SERVICE_VERSION` at
deployment. Do not replace these values. `OTEL_METRICS_EXPORTER=none` and
`OTEL_LOGS_EXPORTER=none` are set on all four application services.

## Coverage

| Service | Work and clients | Instrumentation |
| --- | --- | --- |
| Api | ASP.NET Core requests | Existing ASP.NET Core instrumentation; W3C Trace Context |
| Api | EF Core, Npgsql, Wolverine PostgreSQL persistence | Npgsql's native `Npgsql` ActivitySource; a real PostgreSQL container test checks export and SQL parameter scrubbing |
| Api | HttpClient, Clerk HTTP, OpenAI HTTP | Existing HttpClient instrumentation; telemetry and privacy-sensitive feedback calls remain excluded |
| Api | Wolverine jobs and messages | Existing `Wolverine` ActivitySource; PostgreSQL transport uses Npgsql |
| Client | Nitro/Node HTTP server and Node HTTP clients | Preloaded `@opentelemetry/instrumentation-http` |
| Client | Native fetch/Undici, including the BFF relay and Clerk | Preloaded `@opentelemetry/instrumentation-undici`; ESM instrumentation hook |
| Backup CRON | Each scheduled/startup/single-shot backup | `backup.run` active span; flush on both success and failure before exit |
| Backup CRON | PostgreSQL `pg_dump` subprocess | Manual CLIENT span with database system, namespace and operation; no credential URL or stderr |
| Backup CRON | AWS SDK v3 S3 and lib-storage multipart upload | `@opentelemetry/instrumentation-aws-sdk`; internal HTTP spans suppressed to avoid duplicates |
| Backup CRON | Other Node HTTP calls | `@opentelemetry/instrumentation-http` with ESM hook |
| Backup Cleanup | Each Bun cron run | `backup-cleanup.run` active span and awaited SDK shutdown |
| Backup Cleanup | Native Bun S3 list/delete | Manual CLIENT spans for `ListObjectsV2` and `DeleteObject`; no object keys in span attributes |

Client, Backup CRON and Backup Cleanup have no cache or queue clients. The Client
has no database driver. Backup Cleanup has no SQL/Redis/fetch calls or HTTP server.
`pg_dump` is a subprocess, not a JavaScript database driver; its span covers the
whole dump rather than individual SQL queries. Native Bun S3 cannot inject custom
trace headers, so the exported CLIENT spans end at the external bucket boundary.

The API uses the same attribute scrubber before all exporters. With Railway
configured, its parent-based sampler records all root work and respects incoming
sampling decisions; Sentry and PostHog consequently receive the same sampled spans.
The Client's existing anonymous Sentry/PostHog provider stays separate. Railway
HTTP spans exclude request paths, query strings, headers, exception events and
status messages. Resource detection is restricted to OTEL environment attributes.

## Deployment prerequisites

Production deployments continue through the existing CI/CD workflow. No manual
redeploy is required to review these changes.

The Client's Railway settings currently point to a deleted config file. In
**Client → Settings → Config-as-code → Config File**, clear
`apps/client/railway.json` before the next CI deployment. Keep root `/`, build
`pnpm build:client`, start `pnpm --filter kijk-client start`, healthcheck `/health`
and port `80`. The start script now preloads the SDK from
[instrumentation.mjs](../apps/client/instrumentation.mjs). No Railway JSON/TOML
configuration file should be reintroduced.

Backup CRON still follows `railwayapp-templates/postgres-s3-backups@main`; a fork
branch or unmerged upstream PR will not change its production code. Backup
Cleanup's complete replacement file is staged in Railway for dashboard review;
applying the staged code deploys it. Its configured cron remains unchanged.

## Live acceptance after deployment

1. Confirm the deployment includes the merged code and Railway's OTEL variables.
   Never print the exporter authentication headers or other secrets.
2. Request each public service and capture `x-railway-trace-id`. The API returns
   405 for HEAD `/`; that response still identifies an edge trace. Use GET for
   actual application operations.
3. Fetch the trace with `get-trace`, passing the project and production environment
   IDs explicitly. Allow ingestion time. Require a span with component `service`;
   edge/proxy spans alone do not prove SDK export.
4. Use an authenticated Client flow that queries PostgreSQL. Inspect the BFF
   CLIENT span, API SERVER span and Npgsql CLIENT child under the same trace ID.
5. After each backup cron actually runs, inspect its job trace. These services
   have no public domains, so they have no edge spans. Check PostgreSQL/S3 for
   Backup CRON and S3 list/delete for Cleanup. A dry run or no expired backups
   correctly produces no DeleteObject span. Do not trigger deletion or change
   production retention settings just to create a test span.
6. Query `get-tracing-coverage` for every service with the production environment
   ID. Require the expected CLIENT spans, remote systems and instrumentation
   scopes listed above. Fix missing coverage in a follow-up PR.

At preparation time, Railway listed only production, with no PR environment.
All four services had zero own spans in the inspected hour. API trace
`b8d02ab3e24c452f093507933efc0d52` contained only edge/proxy spans. This is the
pre-deployment baseline, not a successful live acceptance result.
