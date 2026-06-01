---
name: fallow
description: Use only after frontend JavaScript or TypeScript code changes in apps/client or frontend packages such as packages/ui and packages/core, before committing frontend JS/TS work, or when explicitly asked to analyze frontend code health, unused code, duplication, circular dependencies, architecture boundaries, or cleanup candidates with Fallow. Do not use for docs-only, API/.NET-only, agent-skill-only, config-only, or non-frontend changes.
version: "1.0.0"
---

# Fallow

Fallow analyzes JavaScript and TypeScript codebases for dead code, duplicate logic, architecture issues, circular dependencies, dependencies, and health/complexity hotspots.

## After making frontend code changes:

Run Fallow Audit for changed frontend files and check that the verdict did not regress. Treat `fail` as something to review and fix when it is related to the current change; treat `warn` as informational unless it points to a clear regression from the change.

If Fallow fails because the tool itself cannot run, cannot install, cannot create its temporary worktree, or reports an external environment issue, committing is still allowed. In that case, include a clear warning in the final response with the failed command and the reason it failed.

In this pnpm-enforced repo, prefer:

```bash
pnpm dlx fallow@latest audit --workspace kijk-client --format json
```

If the package is already available locally, `pnpm fallow audit --workspace kijk-client --format json` is also fine.

## For general cleanup or code improvement:

Run the focused checks that match the task:

```bash
pnpm dlx fallow@latest dead-code --workspace kijk-client --format json
pnpm dlx fallow@latest dupes --workspace kijk-client --format json
pnpm dlx fallow@latest health --workspace kijk-client --format json
pnpm dlx fallow@latest fix --workspace kijk-client --dry-run --format json
```

Use `fix --dry-run` before applying any automatic cleanup. Do not apply Fallow fixes without reviewing the diff.

For cleanup scans, do not block unrelated commits solely because Fallow could not execute or reports inherited findings. Report the failure or inherited findings as a warning and continue with the remaining verification.

## Command

```bash
pnpm dlx fallow@latest audit --workspace kijk-client --format json
```

| Command | Purpose |
| --- | --- |
| `audit` | Runs changed-file dead-code, duplication, and health checks with a pass/warn/fail verdict |
| `dead-code` | Finds unused files, exports, types, dependencies, cycles, and boundary issues |
| `dupes` | Finds repeated logic; add `--mode semantic` when renamed-variable clones matter |
| `health` | Reports complexity, maintainability, hotspots, and refactor targets |
| `fix --dry-run` | Previews automatic cleanup without changing files |
| `--workspace kijk-client` | Scopes analysis to the frontend workspace |
| `--format json` | Produces structured output for agent review |
