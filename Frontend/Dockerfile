# Build stage - ARM64 compatible
FROM --platform=linux/arm64 node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the React app
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
