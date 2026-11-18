FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Same SDK as CI (global.json rolls forward to the latest major): Api.SourceGenerators needs its Roslyn version.
FROM mcr.microsoft.com/dotnet/sdk:11.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/Api/Api.csproj", "src/Api/"]
COPY ["src/Infrastructure/Infrastructure.csproj", "src/Infrastructure/"]
COPY ["src/Domain/Domain.csproj", "src/Domain/"]
COPY ["src/Shared/Shared.csproj", "src/Shared/"]
COPY ["src/Application/Application.csproj", "src/Application/"]
COPY ["src/Api.SourceGenerators/Api.SourceGenerators.csproj", "src/Api.SourceGenerators/"]
COPY ["./.editorconfig", "./"]
COPY ["./Directory.Build.props", "./"]
COPY ["./Directory.Build.Release.props", "./"]
COPY ["./Directory.Packages.props", "./"]
RUN dotnet restore "src/Api/Api.csproj"
COPY ["src/Api/", "src/Api/"]
COPY ["src/Application/", "src/Application/"]
COPY ["src/Domain/", "src/Domain/"]
COPY ["src/Infrastructure/", "src/Infrastructure/"]
COPY ["src/Shared/", "src/Shared/"]
COPY ["src/Api.SourceGenerators/", "src/Api.SourceGenerators/"]
WORKDIR "/src/src/Api"

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
# The OpenAPI document is only needed for client generation and would require the .NET 10 runtime in the SDK 11 image.
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false -p:TieredPGO=true \
    -p:OpenApiGenerateDocuments=false -p:OpenApiGenerateDocumentsOnBuild=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Api.dll"]
