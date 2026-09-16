FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && mkdir -p /app/data && chown node:node /app/data
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
USER node
EXPOSE 3001
CMD ["npm", "run", "server"]
