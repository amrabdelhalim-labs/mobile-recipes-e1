FROM node:22-alpine

WORKDIR /app

# Build-time defaults (can be overridden at runtime by entrypoint).
ARG DEFAULT_VITE_API_URL=http://localhost:3000
ARG DEFAULT_VITE_BASE_URL=/

ENV BAKED_VITE_API_URL=${DEFAULT_VITE_API_URL}
ENV BAKED_VITE_BASE_URL=${DEFAULT_VITE_BASE_URL}

# Do not set NODE_ENV=production before npm ci — it skips devDependencies (tsc, vite toolchain).
COPY app/package*.json ./
# Cypress binary is not needed for production image build/runtime; skip downloading it to avoid cache bloat and scan noise.
RUN CYPRESS_INSTALL_BINARY=0 npm ci

COPY app/ ./
ENV NODE_ENV=production
COPY docker/app-entrypoint.sh /usr/local/bin/app-entrypoint.sh
RUN chmod +x /usr/local/bin/app-entrypoint.sh

EXPOSE 4173

ENTRYPOINT ["/usr/local/bin/app-entrypoint.sh"]
