# ── Stage 1: dev ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

RUN npm install --workspace=packages/shared --workspace=packages/server

COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/

EXPOSE 3001

CMD ["npm", "run", "dev", "--workspace=packages/server"]

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN npm ci --workspace=packages/shared --workspace=packages/server

COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/

# Build shared first — server tsc resolves @rps/shared from source
# but at runtime node needs packages/shared/dist/index.js
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/server

# ── Stage 3: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

# Production deps only — workspace symlink node_modules/@rps/shared → packages/shared
RUN npm ci --workspace=packages/shared --workspace=packages/server --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/server/dist packages/server/dist

EXPOSE 3010

CMD ["node", "packages/server/dist/index.js"]
