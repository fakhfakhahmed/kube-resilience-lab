FROM node:25-alpine

LABEL org.opencontainers.image.title="Kube Resilience Lab" \
      org.opencontainers.image.description="A bounded Kubernetes resilience experiment lab" \
      org.opencontainers.image.authors="Ahmed Fakhfakh"

WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
# No npm install: application and target use only the Node.js standard library.
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/
COPY --chown=node:node public/ ./public/
USER node
EXPOSE 8080
CMD ["node", "src/server.mjs"]
