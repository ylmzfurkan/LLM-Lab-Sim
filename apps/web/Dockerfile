FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy workspace manifests for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter web...

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
WORKDIR /app/apps/web
RUN pnpm build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY --from=build /app /app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
