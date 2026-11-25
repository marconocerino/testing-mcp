FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
# No CopilotKit telemetry (E5-S4: no traffic to CopilotKit or other external services).
ENV NODE_ENV=production PORT=4000 AGENT_URL=http://agent-service:8090/agent COPILOTKIT_TELEMETRY_DISABLED=true DO_NOT_TRACK=true
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/main.js"]
