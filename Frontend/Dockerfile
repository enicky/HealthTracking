# Build stage - ARM64 compatible
FROM --platform=linux/arm64 node:20-slim AS build
WORKDIR /app

# Accept build-time API URL
ARG VITE_API_URL=http://localhost:5001
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY Frontend/package*.json ./

# Install dependencies with npm verbose output to show progress
RUN npm install --verbose

# Copy source code
COPY Frontend/. ./

# Build the React app with environment variables
RUN npm run build

# Runtime stage - ARM64 compatible
FROM --platform=linux/arm64 node:20-alpine
WORKDIR /app

# Install serve to run static files
RUN npm install -g serve

# Copy built app from build stage
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 3000

# Start serve
CMD ["serve", "-s", "dist", "-l", "3000"]
