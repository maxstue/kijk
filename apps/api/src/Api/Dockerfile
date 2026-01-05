FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/Api/Api.csproj", "src/Api/"]
COPY ["src/Infrastructure/Infrastructure.csproj", "src/Infrastructure/"]
COPY ["src/Domain/Domain.csproj", "src/Domain/"]
COPY ["src/Shared/Shared.csproj", "src/Shared/"]
COPY ["src/Application/Application.csproj", "src/Application/"]
COPY ["./Directory.Build.props", "./"]
COPY ["./Directory.Packages.props", "./"]
RUN dotnet restore "src/Api/Api.csproj"
COPY . .
WORKDIR "/src/src/Api"

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
# RUN dotnet publish "Api.csproj" -c "$BUILD_CONFIGURATION" -o /app/publish \
#     -p:UseAppHost=false \
#     -p:PublishReadyToRun=true \
#     -p:PublishSingleFile=true \
#     -p:InvariantGlobalization=true \
#     -p:TieredPGO=true \
#     --self-contained=false
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false \
    -p:InvariantGlobalization=true \
    -p:TieredPGO=true


FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Api.dll"]
