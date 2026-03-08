# Build stage - ARM64 compatible
FROM --platform=linux/arm64 mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy solution file and all project files
COPY ["Backend/HealthPlatform.sln", "./"]
COPY ["Backend/src/HealthPlatform.Domain/", "src/HealthPlatform.Domain/"]
COPY ["Backend/src/HealthPlatform.Application/", "src/HealthPlatform.Application/"]
COPY ["Backend/src/HealthPlatform.Infrastructure/", "src/HealthPlatform.Infrastructure/"]
COPY ["Backend/src/HealthPlatform.Api/", "src/HealthPlatform.Api/"]
COPY ["Backend/tests/HealthPlatform.Tests/", "tests/HealthPlatform.Tests/"]

# Restore all dependencies
RUN dotnet restore "HealthPlatform.sln"

# Publish the API project
RUN dotnet publish "src/HealthPlatform.Api/HealthPlatform.Api.csproj" -c Release -o /app/publish --no-restore

# Runtime stage - ARM64 compatible
FROM --platform=linux/arm64 mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "HealthPlatform.Api.dll"]
