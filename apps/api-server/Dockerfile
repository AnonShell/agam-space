# --- 1. Builder Stage: Build source files ---
FROM node:22-bullseye-slim AS builder

WORKDIR /app

RUN apt-get update && \
  apt-get install -y --no-install-recommends python3 make g++ && \
  npm install -g npm@11.7.0 pnpm && \
  rm -rf /var/lib/apt/lists/*

# Copy package files first for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY --parents apps/*/package.json ./
COPY --parents apps/web/scripts/ ./
COPY --parents packages/*/package.json ./

# Install dependencies (cached if package.json unchanged)
RUN pnpm install --filter=api-server... && \
    pnpm install --filter=web...

# Copy all source code and config files
COPY . .

# Build everything in one layer
RUN find . -name '*.tsbuildinfo' -delete && \
    pnpm build:packages && \
    pnpm --filter=api-server exec pnpm build && \
    pnpm --filter=web exec pnpm build:prod


# --- 2. Deps Stage: Create clean deployable output ---
FROM node:22-bullseye-slim AS deps

WORKDIR /app

RUN apt-get update && \
  apt-get install -y --no-install-recommends python3 make g++ && \
  npm install -g npm@11.7.0 pnpm && \
  rm -rf /var/lib/apt/lists/*

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api-server/package.json ./apps/api-server/
COPY packages/core/package.json ./packages/core/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/client/package.json ./packages/client/

# Install production dependencies
RUN pnpm install --prod --filter=api-server... && \
  apt-get purge -y python3 make g++ && \
  apt-get autoremove -y && \
  apt-get clean && \
  rm -rf /root/.npm /root/.pnpm-store /root/.cache /tmp/*

# Copy build output from builder
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/apps/api-server/dist ./apps/api-server/dist

RUN pnpm deploy deploy/ --prod --filter=api-server --legacy

COPY ./apps/api-server/migrations/ ./deploy/dist/migrations/
COPY --from=builder /app/apps/web/out ./deploy/public


# --- 3. Hardened Runner Stage: Security-hardened production image ---
FROM dhi.io/node:22-alpine3.23 AS runner-hardened

RUN apk add --no-cache wget tini && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/yarn \
           /usr/local/bin/yarnpkg \
           /usr/local/bin/corepack || true

ARG BUILD_ID
ARG BUILD_COMMIT
ARG APP_VERSION

ENV BUILD_ID=${BUILD_ID} \
    BUILD_COMMIT=${BUILD_COMMIT} \
    APP_VERSION=${APP_VERSION} \
    NODE_ENV=production

WORKDIR /app

COPY --from=deps /app/deploy/ /app/

RUN chmod -R 555 /app/public

VOLUME ["/data"]

EXPOSE 3331

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -q --spider http://localhost:3331/api/v1/server/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]


# --- 4. Runner Stage: Minimal production image (DEFAULT) ---
FROM node:22-alpine AS runner

RUN apk add --no-cache wget tini && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/yarn \
           /usr/local/bin/yarnpkg \
           /usr/local/bin/corepack

ARG BUILD_ID
ARG BUILD_COMMIT
ARG APP_VERSION

ENV BUILD_ID=${BUILD_ID} \
    BUILD_COMMIT=${BUILD_COMMIT} \
    APP_VERSION=${APP_VERSION} \
    NODE_ENV=production

WORKDIR /app

COPY --from=deps /app/deploy/ /app/

RUN chmod -R 555 /app/public

VOLUME ["/data"]

EXPOSE 3331

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -q --spider http://localhost:3331/api/v1/server/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]

