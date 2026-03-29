FROM node:22-alpine

WORKDIR /app

# Build-time defaults (can be overridden at runtime).
ARG DEFAULT_NODE_ENV=production
ARG DEFAULT_PORT=3000
ARG DEFAULT_CORS_ORIGINS=http://localhost:5173,http://localhost:8100
ARG DEFAULT_STORAGE_TYPE=local

ENV NODE_ENV=${DEFAULT_NODE_ENV}
ENV PORT=${DEFAULT_PORT}
ENV CORS_ORIGINS=${DEFAULT_CORS_ORIGINS}
ENV STORAGE_TYPE=${DEFAULT_STORAGE_TYPE}

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./

RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --spider "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "app.js"]
