# ── Stage 1: dev ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/

RUN npm install --workspace=packages/shared --workspace=packages/client

COPY packages/shared/ packages/shared/
COPY packages/client/ packages/client/

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace=packages/client", "--", "--host"]

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# VITE_SERVER_URL is baked into the SPA bundle at build time
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/

RUN npm ci --workspace=packages/shared --workspace=packages/client

# Vite resolves @rps/shared from source via alias — copy source, no pre-build needed
COPY packages/shared/ packages/shared/
COPY packages/client/ packages/client/

RUN npm run build --workspace=packages/client

# ── Stage 3: production ───────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Copy React SPA from builder
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

# Custom nginx config — handles SPA client-side routing
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
