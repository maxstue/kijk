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

## Production release

Run **Actions → Production Release** from `main`. The workflow uses the existing `RAILWAY_DEPLOY_TOKEN` from Infisical `prod /CI/Deploy`. It writes the plan to the run summary and applies it before migrations and deployments. Destructive plans stop the release.

See [Release Process](https://linear.app/justmax/document/release-process-563ce9397fc5) for the release sequence and [Operations](https://linear.app/justmax/document/operations-5405a97dcb1b#deployments) for failure handling.
