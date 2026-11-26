# Railway infrastructure

[`railway.ts`](./railway.ts) defines the Railway project `kijk` (environment `production`) as [Infrastructure as Code](https://docs.railway.com/infrastructure-as-code): services, build and deploy settings, the domain, the Postgres database, the backup bucket and every service variable. Secrets are `preserve()` and stay in Railway; plain configuration is written out.

The file does not deploy code. Releases still run through the GitHub Actions deployment workflow.

## Workflow

Requires the Railway CLI (5.75+) and `pnpm install` for the `railway` SDK. Link the checkout once with `railway link --project kijk --environment production`.

```bash
railway config plan                       # compare the file with Railway; must be reviewed
railway config plan --detailed-exit-code  # 0 = in sync, 2 = changes, else error
```

Change Railway settings in `railway.ts` instead of the dashboard, so the plan stays empty. If someone changes a setting in the dashboard, the next plan shows it as drift: adopt it in the file, otherwise the next release reverts it. Settings the SDK cannot express (for example the upstream repository of the backup images) remain dashboard-only.

## CI/CD

- The production release plans the release commit and applies the saved plan before migrations and deployments. It uses the existing `RAILWAY_DEPLOY_TOKEN`, scoped to `kijk` / `production`, from Infisical `prod /CI/Deploy` through the production identity. A destructive or invalid plan stops the release. An explicitly approved destructive change can be applied locally with `railway config apply --confirm-destructive`.
- The release uses the composite action `.github/actions/railway-config`, which pins the Railway CLI version and checksum and writes the plan to the release summary.
