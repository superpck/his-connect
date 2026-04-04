# =========================================================
# Build stage
# =========================================================

FROM node:24-alpine AS builder

# Upgrade all OS packages to patch known vulnerabilities
RUN apk upgrade --no-cache

WORKDIR /usr/src/his_connect

# Install build dependencies for native modules (python3, make, g++, etc.)
RUN apk add --no-cache python3 make g++ linux-headers

# Copy TypeScript configuration and source files
COPY package.json tsconfig.json ./

# Install dependencies with BuildKit cache mounts for faster builds
RUN npm install

# Copy source files
COPY src ./src

# Build the application
RUN npm run build

RUN npm prune --production

# =========================================================
# Production stage
# =========================================================
FROM node:24-alpine

# Upgrade all OS packages to patch known vulnerabilities
RUN apk upgrade --no-cache

WORKDIR /usr/src/his_connect

# Build tools required for rebuilding native modules (e.g. better-sqlite3)
RUN apk add --no-cache python3 make g++

RUN npm install -g pm2

COPY --from=builder /usr/src/his_connect/node_modules ./node_modules

COPY --from=builder /usr/src/his_connect/app ./app

COPY package.json ./

# Rebuild native modules to match the current Node.js runtime ABI
RUN npm rebuild better-sqlite3

# Create data directory for cache database
RUN mkdir -p data && chmod 777 data

EXPOSE 3004

# Start application with PM2 in cluster mode
CMD ["pm2-runtime", "start", "app/app.js", "-i", "2", "--name", "his-connect"]
