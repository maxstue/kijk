# Contributing

Please note we have a code of conduct, please follow it in all your interactions with the project.

## Any enhancements/bugs/etc you see?

Add an [issue](https://github.com/maxstue/kijk/issues). We'll review it, add labels and reply within a few days.

## See an issue you'd like to work on?

Comment on the issue that you'd like to work on it and we'll add the claimed label. If you see the claimed label already on the issue you might want to ask the contributor if they'd like some help.

## Documentation/etc need updating?

Go right ahead! Just submit a pull request when you're done.

## Pull Request Process

1. Ensure the code is up to date and that it follows the clean code guidelines.
2. Update the README.md and/ or wiki with details of changes to the interface, this includes new environment
   variables, exposed ports, useful file locations and container parameters.
3. Your merge request will be reviewed by us and if everything is in order it will get merged.

## Get Your Environment Ready

The following information is provided to help you get up and contributing as quickly as possible.

### Tools

Before you can start you need to install the following tools

- [Pnpm](https://pnpm.io/)
- [node](https://nodejs.org/en)
- [dotnet](https://dotnet.microsoft.com/en-us/download)
- [Docker](https://www.docker.com/products/docker-desktop/)
  - u can install any other docker desktop alternatives as long as they are based on docker, e.g. [orbstack](https://orbstack.dev/)
- [Infisical CLI](https://infisical.com/docs/documentation/getting-started/cli)

### Local secrets with Infisical

Install the CLI on macOS with Homebrew:

```bash
brew install infisical/get-cli/infisical
```

For Windows and Linux, follow the linked official installation guide above. The repository is already linked to the
Kijk Infisical project through `.infisical.json`. Ask a project maintainer for access to the project, then authenticate
once from a terminal:

```bash
infisical login
```

The browser login is the default. In a terminal without browser access, use the interactive flow instead:

```bash
infisical login --interactive
```

Local development uses the `dev` Infisical environment. The API reads secrets from `/Api`, while the client reads
configuration from `/Client`. The workspace `dev` scripts inject those values into the child process without writing
them to a local file:

```bash
pnpm dev:api
pnpm dev:client
```

Run `pnpm dev` to start both processes with their respective Infisical paths. If authentication has expired, run
`infisical login` again. Do not commit exported secrets or pass access tokens as command-line arguments.

### Frontend (FE) - Client

Client configuration is managed in the Infisical `/Client` path and injected when the client starts. Vite exposes
only variables prefixed with `VITE_` to browser code.

### Backend (BE) - Api

API secrets are managed in the Infisical `/Api` path and injected when the API starts.

### Database

We use `dotnet ef` just be inside the apps/api folder and run `dotnet tools restore` to install all need dotnet cli tools.
Than you need to run `dotnet ef database update --project Kijk.Api/Kijk.Api.csproj` to update you database.

> Before you can update the database you need to [start](#starting-everything) the `docker-compose.yml` file from the project root.

### Telemetry and feature flags

Sentry and PostHog currently receive the same scrubbed errors and OTLP traces for comparison. The long-term split
is still open; PostHog surveys/feedback and global feature flags remain required. Browser analytics and tracing
require consent; minimal error reporting is separate. Unconfigured telemetry destinations are skipped locally.

Optional configuration in Infisical:

- **API:** `Sentry__Dsn`, `PostHog__ProjectToken`, `PostHog__HostUrl` (EU ingestion host).
- **Client:** `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_URL`.
- **Feedback:** move the former `VITE_POSTHOG_SURVEY_ID` value to API setting `Telemetry__FeedbackSurveyId`.
- **Flags:** `FeatureFlags__SecretApiKey` stays API-only. Use global boolean `finances` / `ai-import` flags with
  0% or 100%, no targeting or variants, and server evaluation. The client reads the API decision.

Configuration details, failure behavior, operating checks and the comparison decision live in the
[Linear ADR](https://linear.app/justmax/document/adr-sentry-und-posthog-parallel-vergleichen-0831d0ff9a64).

### Clerk

This project uses [Clerk](https://clerk.com/) for authentication.
The client publishable key and API authentication settings are supplied by the respective Infisical paths. If you
need an isolated local Clerk setup, create a free Clerk organization and add its values to your personal Infisical
overrides instead of a committed file.

## Starting everything

1. Run `docker compose up` inside of a terminal
   - you need to be inside the project root folder
   - or start the docker service with a tool of your liking
2. Run `pnpm dev` from the project root to start the API and client with their Infisical configuration.
   - Use `pnpm dev:api` or `pnpm dev:client` to start only one application.

## CI building blocks

`ci.yml` composes reusable workflows. Each app or package has one independent job; its checks run as sequential
steps with one setup. E2E is a separate job after the app checks. `ci-result` is the required status check.

To add a JavaScript app or package:

1. Provide `fmt`, `lint` and `typecheck` scripts, plus `build` or `test:coverage` when enabled.
2. Add an `apps-<name>` or `packages-<name>` caller of `_js-workspace.yml` in `ci.yml`, with `workspace` and
   `directory`. Enable `build`, `test` and `browser` as needed. Use the same `changes.outputs.js-workspaces`
   condition as the existing callers; change detection includes new workspaces and their dependents automatically.
   Browser setup uses the workspace directory by default. If another workspace provides the Playwright CLI, set
   `browser-directory` to that directory (as the UI package does).
3. Add the caller to both `sonar.needs` and `ci-result.needs`. Coverage artifacts are discovered automatically.
4. If the app needs E2E, add a caller of `_js-e2e.yml` with `needs: [apps-<name>]` and include it in
   `ci-result.needs`. Configure `command`, `timeout`, `secrets-env` and `secrets-path` as needed; grant
   `contents: read` and `id-token: write` for Infisical OIDC.
   The app's `directory` must provide the Playwright CLI; it is used for both browser setup and test execution.

For a .NET app, call `_dotnet.yml` with `workspace`, `directory`, `solution` and optionally `format-exclude`.
Add its paths to `_changes.yml` and its caller to `sonar.needs` and `ci-result.needs`.

Shared setup stays in `.github/actions/setup-js` and `.github/actions/setup-dotnet`; entry workflows contain no
check implementation. `_js-audit.yml` handles the repository-wide JavaScript dependency audit, and `_sonar.yml`
collects coverage from the same run without repeating tests.
