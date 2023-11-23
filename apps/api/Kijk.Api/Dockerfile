FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Kijk.Api/Kijk.Api.csproj", "Kijk.Api/"]
RUN dotnet restore "Kijk.Api/Kijk.Api.csproj"
COPY . .
WORKDIR "/src/Kijk.Api"
RUN dotnet build "Kijk.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Kijk.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Kijk.Api.dll"]
