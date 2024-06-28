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
- [docker]([https://www.docker.com/](https://www.docker.com/products/docker-desktop/))
  - u can install any other docker desktop alternatives as long as they are based on docker, e.g. [orbstack](https://orbstack.dev/)

### Frontend (FE) - Client

First you need to copy the `.env` file into a new one and renami it `.env.local`. It should look something like this
```env
# Base
VITE_BASE_API_URL="https://localhost:7043"
VITE_API_URL="$VITE_BASE_API_URL/api"
VITE_WEB_URL="https://kijk-ruby.vercel.app/"
# Devtools
VITE_DEVTOOLS_LOGGER="false"
# Auth third party
VITE_CLERK_PUBLISHABLE_KEY=
# Sentry
VITE_SENTRY_DSN=
```
Than complete the next steps:

### Backend (BE) - Api

For adding sensitive data to the backend you need to manage you own [user secret file](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-8.0&tabs=windows)

### Database

We use `dotnet ef` just be inside the apps/api folder and run `dotnet tools restore` to install all need dotnet cli tools. 
Than you need to run `dotnet ef database update --project Kijk.Api/Kijk.Api.csproj` to update you database.

> Before you can update the database you need to [start](#starting-everything) the `docker-compose.yml` file from the project root.

### Sentry

This project uses [Sentry](https://sentry.io/welcome/) for error tracking. 
For local development in the `client`-app you can and should leave the `VITE_SENTRY_DSN` variable empty.
For the `api`-app you should leave the settings inside `appsettings.{Environment}.json` also empty.

### Clerk

This project uses [Clerk](https://clerk.com/) for authentication. 
For local development you should create your own clerk organization (free tier) and save your own key to `VITE_CLERK_PUBLISHABLE_KEY`(`client`-app) variable in the env file. You get the key after creating you organization.
For the `api`-app you should add your clerk url to you user secret file 
```json 
  "Auth": {
    "Authority":"<your url>",
    "AuthorizedParty":"http://localhost:5004"
  },
```

## Starting everything

1. Run `docker compose up` inside of a terminal
    - you need to be inside the project root folder 
    - or start the docker service with a tool of your liking
2. Start the api from the terminal with `dotnet run --project Kijk.Api/Kijk.Api.csproj`
    - you need to be inside the apps/api folder
    - or start it with a tool of your liking
3. Start the client from the terminal with `pnpm dev`
    - you need to be inside the apps/client folder
    - or start it with a tool of your liking
4. Start the web from the terminal with `pnpm dev`
    - you need to be inside the apps/web folder
    - or start it with a tool of your liking
