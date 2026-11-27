import {
  bucket,
  defineRailway,
  github,
  group,
  image,
  postgres,
  preserve,
  project,
  ref,
  service,
  volume,
} from 'railway/iac';

// Railway infrastructure of the `kijk` project (environment `production`).
// Variables are managed (the default): this file owns every variable on these services. Secrets stay in Railway as
// `preserve()`; plain configuration is written out so changes are reviewed in pull requests.
// The release applies configuration after migrations because Railway can redeploy affected services.
// The release then uploads the selected API and Client source commit with `railway up`.

const REGION = 'europe-west4-drams3a';
const REPO = 'maxstue/kijk';
const APP_URL = 'https://kijk.justmax.xyz';

// Telemetry goes to Sentry and PostHog through the app SDKs; Railway's OTLP logs and metrics stay off.
const otelExportersOff = { OTEL_LOGS_EXPORTER: 'none', OTEL_METRICS_EXPORTER: 'none' };

// Patch updates of the backup images (github.com/maxstue/postgres-s3-backups-cleanup),
// every night between 02:00 and 06:00.
const nightlyPatchUpdates = {
  type: 'patch',
  schedule: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, startHour: 2, endHour: 6 })),
} as const;

export default defineRailway(() => {
  const Postgres = postgres('Postgres', { region: REGION });
  Postgres.deploy = {
    limitOverride: { containers: { cpu: 1, memoryBytes: 2_000_000_000 } },
    multiRegionConfig: { [REGION]: { numReplicas: 1 } },
    restartPolicyMaxRetries: 3,
  };
  Postgres.networking = { privateNetworkEndpoint: 'postgres' };

  const dbVolume = volume('db-volume', {
    region: REGION,
    sizeMB: 5000,
    allowOnlineResize: true,
    alerts: { usage: { '80': {}, '95': {}, '100': {} } },
  });

  const backupBucket = bucket('sorted-briefcase-JKsJ', { region: 'ams' });
  const backupBucketName = ref(backupBucket, 'BUCKET');
  const backupBucketEndpoint = ref(backupBucket, 'ENDPOINT');

  const Api = service('Api', {
    source: github(REPO, { branch: 'main', rootDirectory: '/apps/api' }),
    build: {
      builder: 'DOCKERFILE',
      buildEnvironment: 'V3',
      dockerfilePath: '/apps/api/src/Api/Dockerfile',
      nixpacksPlan: { providers: ['...'] },
      watchPatterns: ['src/**', 'Directory.Build.props', 'Directory.Packages.props', 'global.json'],
    },
    healthcheck: '/health',
    replicas: { [REGION]: 1 },
    deploy: {
      limitOverride: { containers: { cpu: 2, memoryBytes: 2_000_000_000 } },
      restartPolicyMaxRetries: 2,
      sleepApplication: true,
    },
    // Private only: the API has no custom domain and is reached through the Client BFF (`API_URL`).
    networking: { privateNetworkEndpoint: 'api' },
    tracing: { enabled: true },
    env: {
      ...otelExportersOff,
      Ai__ApiKey: preserve(),
      Ai__Enabled: 'true',
      Auth__Authority: 'https://clerk.kijk.justmax.xyz',
      Auth__AuthorizedParties__0: APP_URL,
      Auth__SecretKey: preserve(),
      ConnectionStrings__DefaultConnection: preserve(),
      DataProtection__KeyEncryptionKey: preserve(),
      FeatureFlags__SecretApiKey: preserve(),
      Fingerprint__MasterKey: preserve(),
      PostHog__HostUrl: 'https://eu.i.posthog.com',
      PostHog__ProjectToken: preserve(),
      Sentry__Dsn: preserve(),
      Telemetry__FeedbackSurveyId: '0191407d-341a-0000-91d8-59879965d335',
      Telemetry__TracesSampleRate: '0.1',
    },
  });

  const Client = service('Client', {
    source: github(REPO, { branch: 'main', rootDirectory: '/' }),
    build: {
      builder: 'RAILPACK',
      buildEnvironment: 'V3',
      buildCommand: 'pnpm build:client',
      nixpacksPlan: { providers: ['staticfile', 'node'] },
      watchPatterns: ['apps/client/**', 'packages/**', 'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml'],
    },
    start: 'pnpm --filter kijk-client start',
    healthcheck: '/health',
    healthcheckTimeout: 120,
    replicas: { [REGION]: 1 },
    deploy: {
      limitOverride: { containers: { cpu: 2, memoryBytes: 2_000_000_000 } },
      restartPolicyMaxRetries: 2,
      sleepApplication: true,
    },
    // Served through Cloudflare; the domain port must match `PORT`.
    domains: [{ domain: 'kijk.justmax.xyz', port: 80 }],
    networking: { privateNetworkEndpoint: 'kijk' },
    tracing: { enabled: true },
    env: {
      ...otelExportersOff,
      // Railway reference: the API's private domain on its listening port, plain HTTP.
      API_URL: 'http://${{Api.RAILWAY_PRIVATE_DOMAIN}}:8080',
      APP_URL,
      CLERK_PUBLISHABLE_KEY: preserve(),
      CLERK_SECRET_KEY: preserve(),
      PORT: '80',
      POSTHOG_API_KEY: preserve(),
      POSTHOG_ENABLE: 'true',
      POSTHOG_HOST: 'https://eu.posthog.com',
      POSTHOG_PROJECT_ID: '48461',
      RAILPACK_NODE_VERSION: '26.12.1',
      SENTRY_AUTH_TOKEN: preserve(),
      SENTRY_ENABLE: 'true',
      VITE_CLERK_PUBLISHABLE_KEY: preserve(),
      VITE_DEVTOOLS_LOGGER: 'false',
      VITE_POSTHOG_KEY: preserve(),
      VITE_POSTHOG_URL: 'https://eu.i.posthog.com',
      VITE_SENTRY_DSN: preserve(),
    },
  });

  // Monthly database backup to the bucket.
  const BackupCron = service('Backup CRON', {
    source: image('ghcr.io/maxstue/postgres-s3-backups-cleanup-backup:2026.11.0', {
      rootDirectory: '/',
      autoUpdates: nightlyPatchUpdates,
    }),
    build: { builder: 'RAILPACK', buildEnvironment: 'V3' },
    replicas: { [REGION]: 1 },
    deploy: {
      cronSchedule: '0 2 1 * *',
      limitOverride: { containers: { cpu: 2, memoryBytes: 3_000_000_000 } },
      restartPolicyType: 'NEVER',
    },
    networking: { privateNetworkEndpoint: 'backup-cron' },
    env: {
      ...otelExportersOff,
      AWS_ACCESS_KEY_ID: preserve(),
      AWS_S3_BUCKET: backupBucketName,
      AWS_S3_ENDPOINT: backupBucketEndpoint,
      AWS_S3_FORCE_PATH_STYLE: 'true',
      AWS_S3_REGION: 'auto',
      AWS_SECRET_ACCESS_KEY: preserve(),
      BACKUP_DATABASE_URL: preserve(),
      GZIP_CONCURRENCY: '20',
      PG_VERSION: '18',
      RAILWAY_DOCKERFILE_PATH: 'docker/backup.Dockerfile',
      RUN_ON_STARTUP: 'true',
      UPLOAD_CONCURRENCY: '20',
    },
  });

  // Half-yearly removal of backups older than `RETENTION_DAYS`, keeping at least `KEEP_MIN`.
  const BackupCleanup = service('Backup Cleanup', {
    source: image('ghcr.io/maxstue/postgres-s3-backups-cleanup-cleanup:2026.11.0', {
      rootDirectory: '/',
      autoUpdates: nightlyPatchUpdates,
    }),
    build: { builder: 'RAILPACK', buildEnvironment: 'V3' },
    start: '/usr/local/bin/cleanup',
    replicas: { [REGION]: 1 },
    deploy: {
      cronSchedule: '0 3 1 1,7 *',
      limitOverride: { containers: { cpu: 2, memoryBytes: 3_000_000_000 } },
      restartPolicyType: 'NEVER',
    },
    networking: { privateNetworkEndpoint: 'backup-cleanup' },
    env: {
      ACCESS_KEY_ID: preserve(),
      AWS_S3_FORCE_PATH_STYLE: 'true',
      BUCKET: backupBucketName,
      DRY_RUN: 'true',
      ENDPOINT: backupBucketEndpoint,
      KEEP_MIN: '1',
      RAILWAY_DOCKERFILE_PATH: 'docker/cleanup.Dockerfile',
      REGION: 'auto',
      RETENTION_DAYS: '183',
      SECRET_ACCESS_KEY: preserve(),
    },
  });

  return project('kijk', {
    resources: [
      dbVolume,
      group('Frontend', [Client]),
      group('Backend', [Postgres, Api]),
      group('Postgres S3 Backups with Cleanup', [BackupCleanup, BackupCron, backupBucket]),
    ],
  });
});
