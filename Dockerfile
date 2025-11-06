FROM node:22-alpine

WORKDIR /usr/src/his_connect

# Copy package files for dependency installation
COPY package.json package-lock.json ./
COPY CHANGELOG.md ./

# Install dependencies with BuildKit cache mounts for faster builds
# Cache npm downloads and node_modules between builds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/src/his_connect/node_modules \
    npm config set fetch-timeout 600000 \
    && npm config set fetch-retries 5 \
    && npm ci --prefer-offline --no-audit

# Install global packages
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pm2 nodemon typescript ts-node

# Copy application code
RUN mkdir -p ./app
COPY app/. ./app

EXPOSE 3004

# Start application with PM2 in cluster mode
CMD ["pm2-runtime", "start", "app/app.js", "-i", "2", "--name", "his-connect"]
