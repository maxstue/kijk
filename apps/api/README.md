# Kijk-Backend

## Getting started

1. Install [dotent](https://dotnet.microsoft.com/en-us/download)
2. Open the project in your editor of choice
3. Install Docker
4. Install locale dotnet tool with `dotnet tool restore`
5. Start docker with command `docker compose up` inside the "root"-folder
6. Create the database with this command `dotnet ef database update`
   - After a PostgreSQL major upgrade, `docker compose` uses a new volume (e.g. `postgres19-data`) and starts with an empty database. To keep local data, dump it with the previous image from the old volume (`postgres-data`) and restore it into the new one.
7. Build and start the "api" project
8. Open a browser to get to the openapi website
   - Or import the OpenApi spec in "Postman" or "Insomnia"
9. Now the api project should be setup correctly 🚀
