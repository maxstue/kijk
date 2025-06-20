---
title: Deployment
description: ''
---

> This documentation is still work in progress, you will find unfinished or empty sections.

The application should be able to be deployable on any server or cloud provider out there. The frontend is a simple Single-Page-Application (SPA) and the backend has a dockerfile. The databse is a PostgreSQL database which is widely supported on the market an well documented.

## Frontend

The fronent 'web' and 'client' are both hosted on vercel and are getting automatically deployed when a push was made in the 'main' branch.

## Backend

The backend is hosted on fly.io and is automatically deployed when a push was made in the 'main' branch.

## Database

The database is hosted on fly.io. The migrations are handled manuelly at the moment, for further information go to the database [docs](./database.md).
