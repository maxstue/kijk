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

### Sentry

This project uses [Sentry](https://sentry.io/welcome/) for error tracking.
For local development, the Sentry values in Infisical may be empty.

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
