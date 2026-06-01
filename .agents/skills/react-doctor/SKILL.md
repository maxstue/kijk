---
name: react-doctor
description: Use only after frontend React JavaScript or TypeScript code changes in apps/client or frontend packages such as packages/ui and packages/core, before committing React UI code, or when explicitly asked to improve React frontend code quality. Do not use for docs-only, API/.NET-only, agent-skill-only, config-only, or non-frontend changes.
version: "1.0.0"
---

# React Doctor

Scans React codebases for security, performance, correctness, and architecture issues. Outputs a 0–100 health score.

## After making React code changes:

Run `npx -y react-doctor@latest . --verbose --diff` and check the score did not regress.

If the score dropped, fix the regressions before committing.

If React Doctor fails because the tool itself cannot run, crashes, cannot install, or reports an external environment issue, committing is still allowed. In that case, include a clear warning in the final response with the failed command and the reason it failed.

## For general cleanup or code improvement:

Run `npx -y react-doctor@latest . --verbose` (without `--diff`) to scan the full codebase. Fix issues by severity — errors first, then warnings.

For cleanup scans, do not block unrelated commits solely because React Doctor could not execute. Report the failure as a warning and continue with the remaining verification.

## Command

```bash
npx -y react-doctor@latest . --verbose --diff
```

| Flag        | Purpose                                       |
| ----------- | --------------------------------------------- |
| `.`         | Scan current directory                        |
| `--verbose` | Show affected files and line numbers per rule |
| `--diff`    | Only scan changed files vs base branch        |
| `--score`   | Output only the numeric score                 |
