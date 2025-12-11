FROM node:22-alpine

WORKDIR /usr/src/his_connect

# Install build dependencies for native modules (python3, make, g++, etc.)
# These are needed for: oracledb, mssql, mysql, pg, bufferutil, utf-8-validate
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    linux-headers

# Copy package files for dependency installation
COPY package.json package-lock.json ./
COPY CHANGELOG.md ./

# Install dependencies with BuildKit cache mounts for faster builds
# Note: Only cache npm downloads, not node_modules (to avoid cross-platform issues)
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 600000 \
    && npm config set fetch-retries 5 \
    && npm ci --prefer-offline --no-audit

# Copy TypeScript configuration and source files
COPY package.json tsconfig.json ./

# Copy source files
COPY src ./src

# Build the application
RUN npm run build

# Remove build dependencies to reduce image size (keep runtime deps)
RUN apk del .build-deps

# Install global packages
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pm2 nodemon typescript ts-node

# Copy application code
# RUN mkdir -p ./app
# COPY app/. ./app

EXPOSE 3004

# Start application with PM2 in cluster mode
CMD ["pm2-runtime", "start", "app/app.js", "-i", "2", "--name", "his-connect"]
