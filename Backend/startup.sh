#!/bin/bash

# startup.sh - Entrypoint script for the Docker container

set -e

echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if nc -z postgres 5432; then
    echo "PostgreSQL is ready!"
    break
  fi
  echo "Waiting for PostgreSQL... ($i/30)"
  sleep 1
done

echo "Running database migrations..."
dotnet ef database update --project HealthTracking.Api

echo "Starting the application..."
#exec "$@"


ASPNETCORE_ENVIRONMENT=Development dotnet run --project HealthPlatform.Api.csproj