FROM node:22-alpine

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node src ./src

USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
