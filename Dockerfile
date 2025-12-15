# =========================================================
# Build stage
# =========================================================

FROM node:22-alpine AS builder

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
FROM node:22-alpine

WORKDIR /usr/src/his_connect

RUN npm install -g pm2

COPY --from=builder /usr/src/his_connect/node_modules ./node_modules

COPY --from=builder /usr/src/his_connect/app ./app

COPY package.json ./

EXPOSE 3004

# Start application with PM2 in cluster mode
CMD ["pm2-runtime", "start", "app/app.js", "-i", "2", "--name", "his-connect"]
