# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:24-alpine AS build
WORKDIR /app
ENV npm_config_audit=false npm_config_fund=false
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN npm ci --prefer-offline --no-audit --no-fund
COPY . .
RUN npm run build
# strip dev dependencies so the runtime can reuse this tree directly
RUN npm prune --omit=dev

# ---- runtime stage ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache ca-certificates unzip

# reuse the pruned production node_modules and built output from the build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/web/dist ./public

ENV PORT=8080
ENV SIDERAIL_DATA_DIR=/data
ENV XRAY_VERSION=v26.9.9
EXPOSE 8080

CMD ["node", "apps/server/dist/index.js"]
