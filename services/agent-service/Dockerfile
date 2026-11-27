# Build from the repo root, so the catalog export can be copied in:
#   docker build -f services/agent-service/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app
COPY services/agent-service/package.json services/agent-service/package-lock.json ./
RUN npm ci
COPY services/agent-service/tsconfig.json ./
COPY services/agent-service/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8090 CATALOG_DIR=/app/catalog
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY services/agent-service/package.json ./
COPY frontend/src/app/catalog/generated/catalog.json frontend/src/app/catalog/generated/catalog.prompt.md ./catalog/
USER node
EXPOSE 8090
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:8090/health || exit 1
CMD ["node", "dist/main.js"]
