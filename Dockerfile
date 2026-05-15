FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN pnpm install --frozen-lockfile

FROM deps AS build

ARG VITE_APP_ID=""
ARG VITE_OAUTH_PORTAL_URL=""
ARG VITE_FRONTEND_FORGE_API_KEY=""
ARG VITE_FRONTEND_FORGE_API_URL=""
ARG VITE_ANALYTICS_ENDPOINT=""
ARG VITE_ANALYTICS_WEBSITE_ID=""

ENV VITE_APP_ID="$VITE_APP_ID"
ENV VITE_OAUTH_PORTAL_URL="$VITE_OAUTH_PORTAL_URL"
ENV VITE_FRONTEND_FORGE_API_KEY="$VITE_FRONTEND_FORGE_API_KEY"
ENV VITE_FRONTEND_FORGE_API_URL="$VITE_FRONTEND_FORGE_API_URL"
ENV VITE_ANALYTICS_ENDPOINT="$VITE_ANALYTICS_ENDPOINT"
ENV VITE_ANALYTICS_WEBSITE_ID="$VITE_ANALYTICS_WEBSITE_ID"

COPY . .

RUN pnpm build && pnpm prune --prod

FROM base AS runtime

ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
