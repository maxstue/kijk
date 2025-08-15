---
title: Configuration
description: How to configuration
---

> This documentation is still work in progress, you will find unfinished or empty sections.

## Api

In your dotnet user secrets file you need to set the followin environment variables

```json
{
  "Auth": {
    "IssuerSigningKey": "<any secret you want>"
  }
}
```

Don't worry about the `Senty:Dsn` variable by setting it as ane empty string (keeping it how it is) sentry is disabled in development mode.

## Database

To run the databse locally you need to have `docker` and `docker compose` installed. [Here](https://docs.docker.com/engine/install/) or any other docker desktop or cli you feel comfortable with.

After that you just run `docker compose up` from the root folder of the project.

To add the latest migration run following command from the `app/api` fodler:

- `dotnet ef database update --project Kijk.Api/Kijk.Api.csproj --startup-project Kijk.Api/Kijk.Api.csproj --context Kijk.Api.Persistence.AppDbContext`

## Client

To run the the client app you need to first install `pnpm` from [here](https://pnpm.io/).

After that go to `apps/client` and install the npm packages with `pnpm install`.
Now you can run the app with `pnpm dev` and got to the localhost adress shown in the terminal.

## Web

To run the the web app you need to first install `pnpm` from [here](https://pnpm.io/).

After that go to `apps/web` and install the npm packages with `pnpm install`.
Now you can run the app with `pnpm dev` and got to the localhost adress shown in the terminal.
