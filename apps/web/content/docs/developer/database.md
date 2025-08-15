---
title: Database
description: ''
---

> This documentation is still work in progress, you will find unfinished or empty sections.

The app uses a PostgreSQL databse with the latest version.

## Migrations

Migrations are run by 'dotnet entity framework core' via migration files, which are automaticlly applied on startup in dev mode. For Production the migration files need to be run against the prod databse or need to be converted intp sql and than run against the production database.
