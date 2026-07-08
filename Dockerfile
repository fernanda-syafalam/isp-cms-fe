# syntax=docker/dockerfile:1.7
# Multi-stage build for the isp-cms-fe SPA.
#
#   1. build   — compile the TypeScript + Vite bundle with pnpm. The
#                VITE_* values are BAKED IN here (Vite inlines them at
#                build time), so they arrive as build args, not runtime
#                env. Point VITE_API_BASE_URL at the real backend, e.g.
#                https://api.example.com/v1.
#   2. runtime — nginx:alpine serving the static bundle with SPA
#                history fallback. No Node, no source, no build tools.

ARG NODE_VERSION=22
ARG PNPM_VERSION=9.15.0

# ---------- Stage 1: build ----------
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-fe,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

COPY . .

# Public build-time config. VITE_ vars must exist BEFORE `pnpm build`
# because Vite replaces import.meta.env.* statically. Never pass secrets
# here — the values ship inside the client bundle.
ARG VITE_API_BASE_URL=/api
ARG VITE_APP_NAME=isp-cms
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

RUN pnpm build

# ---------- Stage 2: runtime ----------
FROM nginx:alpine AS runtime

# SPA-aware config (history fallback, gzip, asset caching, security headers).
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
